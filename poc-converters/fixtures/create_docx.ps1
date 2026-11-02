$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Add()
    $doc.Content.Text = "Hello File Converter! This is a test DOCX with Title and Paragraph.`nCreated for Phase 4 PoC validation."
    $out = "D:\Konverter\poc-converters\fixtures\sample.docx"
    # wdFormatXMLDocument = 16
    $doc.SaveAs([ref]$out, [ref]16)
    $doc.Close()
    Write-Host "DOCX created successfully at $out"
} finally {
    $word.Quit()
}

