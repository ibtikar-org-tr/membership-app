export const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📢 Announcement Sender | Ibtikar VMS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .main-container {
            max-width: 1400px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.95;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .content-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .form-section {
            min-width: 0;
        }
        
        .preview-section {
            min-width: 0;
        }
        

        
        .info {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            padding: 20px;
            border-left: 4px solid #667eea;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .info strong {
            color: #667eea;
            font-size: 16px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        
        input[type="text"],
        input[type="password"],
        textarea,
        select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 15px;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        textarea {
            min-height: 150px;
            resize: vertical;
            font-family: inherit;
            direction: auto;
            text-align: start;
        }
        
        textarea[dir="rtl"] {
            direction: rtl;
            text-align: right;
        }
        
        textarea[dir="ltr"] {
            direction: ltr;
            text-align: left;
        }
        
        input[type="file"] {
            padding: 10px;
            border: 2px dashed #e0e0e0;
            border-radius: 10px;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        input[type="file"]:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .attachment-type {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }
        
        .radio-label:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .radio-label input[type="radio"]:checked + span {
            color: #667eea;
        }
        
        .radio-label input[type="radio"] {
            cursor: pointer;
        }
        
        .file-info {
            font-size: 13px;
            color: #888;
            margin-top: 8px;
            font-style: italic;
        }
        
        .btn-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        
        button {
            flex: 1;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            font-family: inherit;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #f0f0f0;
            color: #666;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .format-btn {
            padding: 8px 16px;
            background: #f0f0f0;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s;
            min-width: 40px;
        }
        
        .format-btn:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .format-btn:active {
            transform: scale(0.95);
        }
        
        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 10px;
            display: none;
            animation: slideIn 0.3s;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .result.success {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
            display: block;
        }
        
        .result.error {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
            display: block;
        }
        
        .result h3 {
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.5);
            padding: 15px;
            border-radius: 8px;
        }
        
        .stat-card .label {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .stat-card .value {
            font-size: 24px;
            font-weight: 700;
        }
        
        .preview {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            border: 2px solid #e0e0e0;
        }
        
        .preview h3 {
            margin-bottom: 15px;
            color: #333;
            font-size: 16px;
        }
        
        .preview-content {
            background: #dcf8c6;
            padding: 15px 18px;
            border-radius: 12px;
            min-height: 100px;
            white-space: pre-wrap;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.5;
            color: #000;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            word-wrap: break-word;
            position: relative;
            direction: auto;
            text-align: start;
        }
        
        .preview-content.empty {
            background: #f0f0f0;
            color: #999;
            font-style: italic;
        }
        
        .preview-content strong {
            font-weight: 700;
        }
        
        .preview-content em {
            font-style: italic;
        }
        
        .preview-content code {
            font-family: 'Courier New', Consolas, monospace;
            background: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 13px;
        }
        
        .preview-content pre {
            font-family: 'Courier New', Consolas, monospace;
            background: rgba(0,0,0,0.05);
            padding: 8px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 5px 0;
        }
        
        .preview-content a {
            color: #2481cc;
            text-decoration: none;
        }
        
        .preview-content a:hover {
            text-decoration: underline;
        }
        
        .preview-content u {
            text-decoration: underline;
        }
        
        .preview-content s {
            text-decoration: line-through;
        }
        
        .character-count {
            text-align: right;
            font-size: 13px;
            color: #888;
            margin-top: 5px;
        }
        

        
        @media (max-width: 1024px) {
            .content-wrapper {
                grid-template-columns: 1fr;
            }
            
            .preview-section {
                order: -1;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .container {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 1.8rem;
            }
            
            .btn-group {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h1>📢 Announcement Sender</h1>
            <p>Send announcements to all registered members</p>
        </div>
        
        <div class="container">
            <div class="info">
                <strong>ℹ️ How it works:</strong> This tool sends announcements to all members in the Google Members Sheet who have registered their Telegram IDs. Messages are sent asynchronously to ensure delivery even if some fail.
            </div>

            <div class="content-wrapper">
                <!-- Form Section (Left) -->
                <div class="form-section">
                    <form id="announcementForm">
                        <div class="form-group">
                            <label for="apiKey">🔑 API Key</label>
                            <input type="password" id="apiKey" placeholder="Enter your API key" required>
                        </div>

                        <div class="form-group">
                            <label for="message">✉️ Message / Caption</label>
                            <div style="margin-bottom: 8px; display: flex; gap: 8px; justify-content: space-between; align-items: center;">
                                <div style="display: flex; gap: 8px;">
                                    <button type="button" class="format-btn" id="boldBtn" title="Bold (Ctrl+B)">
                                        <strong>B</strong>
                                    </button>
                                    <button type="button" class="format-btn" id="italicBtn" title="Italic (Ctrl+I)">
                                        <em>I</em>
                                    </button>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button type="button" class="format-btn" id="rtlBtn" title="Right-to-Left">
                                        RTL
                                    </button>
                                    <button type="button" class="format-btn" id="ltrBtn" title="Left-to-Right">
                                        LTR
                                    </button>
                                </div>
                            </div>
                            <textarea id="message" placeholder="Enter your announcement message..." required dir="auto"></textarea>
                            <div class="character-count">
                                <span id="charCount">0</span> characters
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="parseMode">📝 Parse Mode</label>
                            <select id="parseMode">
                                <option value="">None (Plain Text)</option>
                                <option value="MarkdownV2" selected>MarkdownV2</option>
                                <option value="HTML">HTML</option>
                                <option value="Markdown">Markdown</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>📎 Attachment Type</label>
                            <div class="attachment-type">
                                <label class="radio-label">
                                    <input type="radio" name="attachmentType" value="none" checked>
                                    <span>📄 Text Only</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="attachmentType" value="photo">
                                    <span>🖼️ Photo</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="attachmentType" value="document">
                                    <span>📁 Document</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group" id="photoGroup" style="display: none;">
                            <label for="photo">📷 Select Photo</label>
                            <input type="file" id="photo" accept="image/*">
                            <div class="file-info">Supported: JPEG, PNG, GIF, etc. Max size: 10 MB</div>
                        </div>

                        <div class="form-group" id="documentGroup" style="display: none;">
                            <label for="document">📄 Select Document</label>
                            <input type="file" id="document">
                            <div class="file-info">Supported: PDF, DOC, DOCX, ZIP, TXT, etc. Max size: 50 MB</div>
                        </div>

                        <div class="btn-group">
                            <button type="button" class="btn-secondary" id="resetBtn">
                                🔄 Reset
                            </button>
                            <button type="submit" class="btn-primary" id="submitBtn">
                                📤 Send Announcement
                            </button>
                        </div>
                    </form>

                    <div id="result" class="result"></div>
                </div>

                <!-- Preview Section (Right) -->
                <div class="preview-section">
                    <div class="preview">
                        <h3>👁️ Message Preview</h3>
                        <div class="preview-content" id="previewContent">
                            Your message preview will appear here...
                        </div>
                    </div>
                    
                    <div class="preview" id="filePreview" style="display: none;">
                        <h3>📎 Attachment Preview</h3>
                        <div id="filePreviewContent"></div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <script>
        // Get API URL from current location
        const apiUrl = window.location.origin + '/api/announcement';

        // Function to parse Telegram formatting
        function parseMarkdown(text, parseMode) {
            if (!text) {
                previewContent.classList.add('empty');
                return 'Your message preview will appear here...';
            }
            
            previewContent.classList.remove('empty');
            
            // Escape HTML first
            let html = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            if (parseMode === 'HTML') {
                // For HTML mode, just return as-is (already escaped)
                return text;
            } else if (parseMode === 'MarkdownV2' || parseMode === 'Markdown') {
                // MarkdownV2 formatting
                // Bold: *text* or **text**
                html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
                html = html.replace(/\\*([^*]+?)\\*/g, '<strong>$1</strong>');
                
                // Italic: _text_ or __text__
                html = html.replace(/__(.+?)__/g, '<em>$1</em>');
                html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');
                
                // Underline: (MarkdownV2 only)
                html = html.replace(/<u>(.+?)<\\/u>/g, '<u>$1</u>');
                
                // Strikethrough: ~text~ or ~~text~~
                html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
                html = html.replace(/~([^~]+?)~/g, '<s>$1</s>');
                
                // Code: \\\`text\\\`
                html = html.replace(/\\\`([^\\\`]+?)\\\`/g, '<code>$1</code>');
                
                // Pre (code blocks): \\\`\\\`\\\`text\\\`\\\`\\\`
                html = html.replace(/\\\`\\\`\\\`([\\\\s\\\\S]+?)\\\`\\\`\\\`/g, '<pre>$1</pre>');
                
                // Links: [text](url)
                html = html.replace(/\\[([^\\]]+?)\\]\\(([^)]+?)\\)/g, '<a href="$2" target="_blank">$1</a>');
                
                return html;
            } else {
                // Plain text - preserve line breaks
                return html;
            }
        }

        // Character counter and preview update
        const messageInput = document.getElementById('message');
        const charCount = document.getElementById('charCount');
        const previewContent = document.getElementById('previewContent');
        const parseModeSelect = document.getElementById('parseMode');
        
        function updatePreview() {
            const count = messageInput.value.length;
            const parseMode = parseModeSelect.value;
            charCount.textContent = count;
            previewContent.innerHTML = parseMarkdown(messageInput.value, parseMode);
        }
        
        messageInput.addEventListener('input', updatePreview);
        parseModeSelect.addEventListener('change', updatePreview);
        
        // Initial preview render
        updatePreview();
        
        // Format buttons
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        
        function wrapSelectedText(before, after) {
            const start = messageInput.selectionStart;
            const end = messageInput.selectionEnd;
            const selectedText = messageInput.value.substring(start, end);
            
            if (selectedText) {
                const newText = messageInput.value.substring(0, start) + 
                               before + selectedText + after + 
                               messageInput.value.substring(end);
                messageInput.value = newText;
                messageInput.focus();
                messageInput.setSelectionRange(start + before.length, end + before.length);
                updatePreview();
            } else {
                // If no text selected, insert markers and place cursor between them
                const newText = messageInput.value.substring(0, start) + 
                               before + after + 
                               messageInput.value.substring(start);
                messageInput.value = newText;
                messageInput.focus();
                messageInput.setSelectionRange(start + before.length, start + before.length);
                updatePreview();
            }
        }
        
        boldBtn.addEventListener('click', () => {
            wrapSelectedText('*', '*');
        });
        
        italicBtn.addEventListener('click', () => {
            wrapSelectedText('_', '_');
        });
        
        // Keyboard shortcuts
        messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    wrapSelectedText('*', '*');
                } else if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    wrapSelectedText('_', '_');
                }
            }
        });
        
        // RTL/LTR toggle buttons
        const rtlBtn = document.getElementById('rtlBtn');
        const ltrBtn = document.getElementById('ltrBtn');
        
        rtlBtn.addEventListener('click', () => {
            messageInput.setAttribute('dir', 'rtl');
            messageInput.focus();
        });
        
        ltrBtn.addEventListener('click', () => {
            messageInput.setAttribute('dir', 'ltr');
            messageInput.focus();
        });
        
        // Auto-detect text direction on input
        messageInput.addEventListener('input', () => {
            if (messageInput.getAttribute('dir') === 'auto') {
                const text = messageInput.value.trim();
                if (text.length > 0) {
                    // Check if first character is RTL (Arabic, Hebrew, etc.)
                    const firstChar = text.charAt(0);
                    const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
                    if (rtlPattern.test(firstChar)) {
                        previewContent.style.direction = 'rtl';
                        previewContent.style.textAlign = 'right';
                    } else {
                        previewContent.style.direction = 'ltr';
                        previewContent.style.textAlign = 'left';
                    }
                }
            }
        });
        
        // Reset button handler
        document.getElementById('resetBtn').addEventListener('click', () => {
            document.getElementById('announcementForm').reset();
            document.getElementById('result').style.display = 'none';
            document.getElementById('filePreview').style.display = 'none';
            updatePreview();
        });

        // Attachment type handling
        const attachmentTypeRadios = document.querySelectorAll('input[name="attachmentType"]');
        const photoGroup = document.getElementById('photoGroup');
        const documentGroup = document.getElementById('documentGroup');
        const filePreview = document.getElementById('filePreview');
        const filePreviewContent = document.getElementById('filePreviewContent');

        attachmentTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                photoGroup.style.display = e.target.value === 'photo' ? 'block' : 'none';
                documentGroup.style.display = e.target.value === 'document' ? 'block' : 'none';
                filePreview.style.display = 'none';
                
                if (e.target.value !== 'photo') document.getElementById('photo').value = '';
                if (e.target.value !== 'document') document.getElementById('document').value = '';
            });
        });

        // File preview
        document.getElementById('photo').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    filePreviewContent.innerHTML = \`<img src="\${e.target.result}" style="max-width: 100%; border-radius: 8px;">\`;
                    filePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('document').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                filePreviewContent.innerHTML = \`
                    <div style="padding: 20px; background: white; border-radius: 8px;">
                        <strong>📄 \${file.name}</strong><br>
                        <span style="color: #888; font-size: 14px;">Size: \${(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                \`;
                filePreview.style.display = 'block';
            }
        });

        // Form submission
        const form = document.getElementById('announcementForm');
        const resultDiv = document.getElementById('result');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const apiKey = document.getElementById('apiKey').value;
            const message = document.getElementById('message').value;
            const parseMode = document.getElementById('parseMode').value;
            const attachmentType = document.querySelector('input[name="attachmentType"]:checked').value;
            
            resultDiv.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Sending...';

            try {
                let response;

                if (attachmentType === 'none') {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': apiKey
                        },
                        body: JSON.stringify({
                            message: message,
                            parse_mode: parseMode || undefined
                        })
                    });
                } else {
                    const formData = new FormData();
                    formData.append('message', message);
                    if (parseMode) formData.append('parse_mode', parseMode);

                    if (attachmentType === 'photo') {
                        const photoFile = document.getElementById('photo').files[0];
                        if (!photoFile) throw new Error('Please select a photo file');
                        formData.append('photo', photoFile);
                    } else if (attachmentType === 'document') {
                        const documentFile = document.getElementById('document').files[0];
                        if (!documentFile) throw new Error('Please select a document file');
                        formData.append('document', documentFile);
                    }

                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'X-API-Key': apiKey },
                        body: formData
                    });
                }

                const data = await response.json();

                if (response.ok) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        <h3>✅ Success!</h3>
                        <p>\${data.message}</p>
                        <div class="stats">
                            <div class="stat-card">
                                <div class="label">Total Members</div>
                                <div class="value">\${data.total_members}</div>
                            </div>
                            <div class="stat-card">
                                <div class="label">With Telegram</div>
                                <div class="value">\${data.members_with_telegram}</div>
                            </div>
                            <div class="stat-card">
                                <div class="label">Notified</div>
                                <div class="value">\${data.members_notified}</div>
                            </div>
                            <div class="stat-card">
                                <div class="label">Attachment</div>
                                <div class="value">\${data.attachment_type}</div>
                            </div>
                        </div>
                    \`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`
                        <h3>❌ Error!</h3>
                        <p>\${data.error || 'Unknown error occurred'}</p>
                        \${data.details ? \`<p><small>Details: \${data.details}</small></p>\` : ''}
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`
                    <h3>❌ Error!</h3>
                    <p>\${error.message}</p>
                \`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '📤 Send Announcement';
            }
        });
    </script>
</body>
</html>`;
