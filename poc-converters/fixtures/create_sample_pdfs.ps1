$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    # Sample 1: 2 pages
    $doc1 = $word.Documents.Add()
    $doc1.Content.Text = "Sample Document 1 - Page 1`r`nThis is test content on page one."
    # Insert page break: wdPageBreak = 7
    $range = $doc1.Content
    $range.Collapse(0) # wdCollapseEnd = 0
    $range.InsertBreak(7)
    $range.Text = "Sample Document 1 - Page 2`r`nThis is test content on page two."
    
    $out1 = "D:\Konverter\poc-converters\fixtures\sample1.pdf"
    # wdFormatPDF = 17
    $doc1.SaveAs([ref]$out1, [ref]17)
    $doc1.Close()
    Write-Host "sample1.pdf created"

    # Sample 2: 1 page
    $doc2 = $word.Documents.Add()
    $doc2.Content.Text = "Sample Document 2 - Page 1`r`nThis document will be merged with Document 1."
    $out2 = "D:\Konverter\poc-converters\fixtures\sample2.pdf"
    $doc2.SaveAs([ref]$out2, [ref]17)
    $doc2.Close()
    Write-Host "sample2.pdf created"
} finally {
    $word.Quit()
}

