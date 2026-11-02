use lopdf::{dictionary, Document, Object};
use md5::{Digest, Md5};
use std::fs;
use std::path::Path;

const PAD_BYTES: [u8; 32] = [
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
    0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A,
];

pub struct SimpleRc4 {
    state: [u8; 256],
    i: u8,
    j: u8,
}

impl SimpleRc4 {
    pub fn new(key: &[u8]) -> Self {
        let mut state = [0u8; 256];
        for (i, v) in state.iter_mut().enumerate() {
            *v = i as u8;
        }
        let mut j: u8 = 0;
        for i in 0..256 {
            j = j.wrapping_add(state[i]).wrapping_add(key[i % key.len()]);
            state.swap(i, j as usize);
        }
        Self { state, i: 0, j: 0 }
    }

    pub fn apply(&mut self, data: &mut [u8]) {
        for byte in data.iter_mut() {
            self.i = self.i.wrapping_add(1);
            self.j = self.j.wrapping_add(self.state[self.i as usize]);
            self.state.swap(self.i as usize, self.j as usize);
            let k = self.state[(self.state[self.i as usize].wrapping_add(self.state[self.j as usize])) as usize];
            *byte ^= k;
        }
    }
}

fn pad_password(pass: &str) -> [u8; 32] {
    let mut padded = [0u8; 32];
    let bytes = pass.as_bytes();
    let len = bytes.len().min(32);
    padded[..len].copy_from_slice(&bytes[..len]);
    padded[len..].copy_from_slice(&PAD_BYTES[..32 - len]);
    padded
}

fn compute_object_key(doc_key: &[u8], id: u32, gen: u16) -> Vec<u8> {
    let mut hasher = Md5::new();
    hasher.update(doc_key);
    hasher.update(&id.to_le_bytes()[..3]);
    hasher.update(&gen.to_le_bytes()[..2]);
    let digest = hasher.finalize();
    let key_len = (doc_key.len() + 5).min(16);
    digest[..key_len].to_vec()
}

pub fn protect_pdf(
    input_path: &str,
    output_path: &str,
    user_password: &str,
    owner_password: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut doc = Document::load(input_path)?;
    if doc.is_encrypted() {
        return Err("Dokumen PDF sudah dalam keadaan terenkripsi".into());
    }

    let owner_pass = owner_password.unwrap_or(user_password);
    let p_user = pad_password(user_password);
    let p_owner = pad_password(owner_pass);

    // Standard Permissions: -4 (All permissions allowed for authenticated user)
    let p_flags: i32 = -4;

    // File ID: 16 bytes
    let file_id: Vec<u8> = vec![
        0x12, 0x34, 0x56, 0x78, 0x90, 0xAB, 0xCD, 0xEF, 0xFE, 0xDC, 0xBA, 0x09, 0x87, 0x65, 0x43, 0x21,
    ];

    // Compute /O (Owner Hash)
    // 1. MD5 of padded owner password
    let mut o_hasher = Md5::new();
    o_hasher.update(&p_owner);
    let mut o_key = o_hasher.finalize().to_vec();
    for _ in 0..50 {
        let mut h = Md5::new();
        h.update(&o_key);
        o_key = h.finalize().to_vec();
    }

    // 2. RC4 encrypt padded user password 20 times (Rev 3)
    let mut o_buf = p_user;
    for xor_byte in 0..=19 {
        let mut cur_key = o_key.clone();
        for b in cur_key.iter_mut() {
            *b ^= xor_byte;
        }
        let mut rc4 = SimpleRc4::new(&cur_key);
        rc4.apply(&mut o_buf);
    }
    let o_hash = o_buf.to_vec();

    // Compute Document Encryption Key (16 bytes, 128-bit)
    let mut key_builder = Vec::new();
    key_builder.extend_from_slice(&p_user);
    key_builder.extend_from_slice(&o_hash);
    key_builder.extend_from_slice(&(p_flags as u32).to_le_bytes());
    key_builder.extend_from_slice(&file_id);

    let mut doc_key = Md5::digest(&key_builder)[..16].to_vec();
    for _ in 0..50 {
        let digest = Md5::digest(&doc_key);
        doc_key.copy_from_slice(&digest[..16]);
    }

    // Compute /U (User Hash)
    let mut u_hasher = Md5::new();
    u_hasher.update(&PAD_BYTES);
    u_hasher.update(&file_id);
    let mut u_buf = [0u8; 32];
    u_buf[..16].copy_from_slice(&u_hasher.finalize());

    for xor_byte in 0..=19 {
        let mut cur_key = doc_key.clone();
        for b in cur_key.iter_mut() {
            *b ^= xor_byte;
        }
        let mut rc4 = SimpleRc4::new(&cur_key);
        rc4.apply(&mut u_buf[..16]);
    }
    let u_hash = u_buf.to_vec();

    // Create /Encrypt dictionary object
    let std_cf = dictionary! {
        "CFM" => "V2",
        "AuthEvent" => "DocOpen",
        "Length" => 128,
    };
    let cf_dict = dictionary! {
        "StdCF" => Object::Dictionary(std_cf),
    };

    let encrypt_dict = dictionary! {
        "Filter" => "Standard",
        "V" => 2,
        "R" => 3,
        "Length" => 128,
        "P" => p_flags,
        "O" => Object::String(o_hash, lopdf::StringFormat::Hexadecimal),
        "U" => Object::String(u_hash, lopdf::StringFormat::Hexadecimal),
        "CF" => Object::Dictionary(cf_dict),
        "StrF" => "StdCF",
        "StmF" => "StdCF",
    };

    let encrypt_id = doc.add_object(Object::Dictionary(encrypt_dict));

    // Set trailer /Encrypt and /ID
    doc.trailer.set("Encrypt", Object::Reference(encrypt_id));
    doc.trailer.set(
        "ID",
        Object::Array(vec![
            Object::String(file_id.clone(), lopdf::StringFormat::Hexadecimal),
            Object::String(file_id, lopdf::StringFormat::Hexadecimal),
        ]),
    );

    // Encrypt all string and stream objects in the document
    for (&id, obj) in doc.objects.iter_mut() {
        if id == encrypt_id {
            continue;
        }

        let obj_key = compute_object_key(&doc_key, id.0, id.1);

        match obj {
            Object::Stream(stream) => {
                let mut rc4 = SimpleRc4::new(&obj_key);
                rc4.apply(&mut stream.content);
            }
            Object::String(ref mut content, _) => {
                let mut rc4 = SimpleRc4::new(&obj_key);
                rc4.apply(content);
            }
            _ => {}
        }
    }

    doc.save(output_path)?;
    Ok(())
}

pub fn unlock_pdf(
    input_path: &str,
    output_path: &str,
    password: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut doc = Document::load(input_path)?;
    if !doc.is_encrypted() {
        return Err("Dokumen PDF tidak terenkripsi / tidak memiliki password".into());
    }

    doc.decrypt(password).map_err(|e| {
        format!("Password salah atau tidak dapat membuka enkripsi: {}", e)
    })?;

    doc.save(output_path)?;
    Ok(())
}

fn main() {
    println!("=== Testing PDF Protect and Unlock ===");

    let sample1 = "poc-converters/fixtures/sample1.pdf";
    let protected_pdf = "poc-converters/output/poc_protected.pdf";
    let unlocked_pdf = "poc-converters/output/poc_unlocked.pdf";

    // 1. Protect PDF
    protect_pdf(sample1, protected_pdf, "rahasia123", None).expect("protect pdf");
    println!("SUCCESS: Protected PDF created at {}", protected_pdf);

    // Verify it is encrypted
    let doc_prot = Document::load(protected_pdf).expect("load protected");
    assert!(doc_prot.is_encrypted(), "Protected PDF must report is_encrypted == true");
    println!("VERIFIED: is_encrypted() == true");

    // 2. Try unlock with wrong password
    let mut doc_wrong = Document::load(protected_pdf).expect("load protected for wrong pass");
    let wrong_res = doc_wrong.decrypt("salah");
    println!("Wrong password result: is_err = {}", wrong_res.is_err());
    assert!(wrong_res.is_err(), "Wrong password must fail");

    // 3. Unlock with correct password
    unlock_pdf(protected_pdf, unlocked_pdf, "rahasia123").expect("unlock pdf");
    println!("SUCCESS: Unlocked PDF created at {}", unlocked_pdf);

    // Verify unlocked is NOT encrypted
    let doc_unlocked = Document::load(unlocked_pdf).expect("load unlocked");
    assert!(!doc_unlocked.is_encrypted(), "Unlocked PDF must report is_encrypted == false");
    let text = doc_unlocked.extract_text(&[1]).unwrap();
    println!("VERIFIED: is_encrypted() == false, Page 1 text preview: {}", text.trim());
}
