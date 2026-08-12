#!/bin/bash

# Create a test PDF file
cat > test-upload.pdf << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
196
%%EOF
EOF

echo "Testing book upload..."
echo "Note: You need to be logged in as admin and have a valid Firebase token"
echo ""
echo "To test manually:"
echo "1. Navigate to http://localhost:3000/admin/books"
echo "2. Fill in the form with:"
echo "   - Title: Test Book"
echo "   - Author: Test Author"
echo "   - Description: Test Description"
echo "   - Category: self-help"
echo "   - Price: 10"
echo "   - File: Select test-upload.pdf"
echo "3. Click 'Upload Book'"
echo ""
echo "The upload should succeed now that JWT keys are fixed and storage service is restarted."
