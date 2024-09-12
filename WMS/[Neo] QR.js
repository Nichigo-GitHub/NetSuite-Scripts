define(['N/render', 'N/record', 'N/search', 'N/file', 'N/https'], function (render, record, search, file, https) {
  function generatePdf() {
    // Load the saved search
    var searchResults = search.load({
      id: 'customsearch_bin_search'
    }).run().getRange({
      start: 0,
      end: 1000
    });

    var html = '<html><body>';
    html += '<table>';
    searchResults.forEach(function (result) {
      var binName = result.getValue({
        name: 'binname'
      });
      var qrCodeUrl = generateQrCode(binName); // Function to generate QR code URL

      html += '<tr>';
      html += '<td><img src="' + qrCodeUrl + '" /></td>';
      html += '<td>' + binName + '</td>';
      html += '</tr>';
    });
    html += '</table>';
    html += '</body></html>';

    // Create PDF
    var pdfFile = render.xmlToPdf({
      xmlString: html
    });

    // Save or email the PDF
    pdfFile.name = 'Bin_QRCodes.pdf';
    pdfFile.folder = 12345; // Set the appropriate folder ID
    pdfFile.save();
  }

  function generateQrCode(text) {
    var qrCodeUrl = 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=' + encodeURIComponent(text);
    return qrCodeUrl;
  }

  return {
    generatePdf: generatePdf
  };
});
