document.addEventListener('DOMContentLoaded', function() {
    // 更新自定义头像样式
    const avatarStyle = document.createElement('style');
    avatarStyle.textContent = `
        .logo-icon {
            background-image: url('/1.png') !important;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .bot-avatar {
            background-image: url('/1.png') !important;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }
    `;
    document.head.appendChild(avatarStyle);
    
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const newChatButton = document.getElementById('new-chat');
    const themeToggle = document.getElementById('theme-toggle');
    const uploadButton = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    
    // 使用AES加密的API密钥
    const encryptedApiKey = "U2FsdGVkX186+EGGWWpWDd5XwyLfniGTgoJoWm5Gm6LJjNAyXI0ToFNn+92urtNddUwfWeWaM7O9JAA9/vPKmw==";
    let apiKey = null; // 将在验证后设置
    
    // 设置当前日期
    const currentDate = document.getElementById('current-date');
    const today = new Date();
    currentDate.textContent = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // 聊天历史记录
    let chatHistory = [];
    
    // 当前上传的图片（base64格式）
    let currentImage = null;
    
    // 密码验证功能
    function verifyPassword() {
        return new Promise((resolve) => {
            // 创建密码输入对话框
            const modal = document.createElement('div');
            modal.className = 'password-modal';
            modal.innerHTML = `
                <div class="password-dialog">
                    <div class="password-header">
                        <h3>访问验证</h3>
                    </div>
                    <div class="password-body">
                        <p>请输入密码解锁清言AI-Gemini 2.0 Flash</p>
                        <input type="password" id="password-input" placeholder="输入密码..." />
                        <div class="error-message" id="password-error"></div>
                    </div>
                    <div class="password-footer">
                        <button id="verify-btn">验证</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            const passwordInput = document.getElementById('password-input');
            const verifyButton = document.getElementById('verify-btn');
            const errorMessage = document.getElementById('password-error');
            
            // 自动聚焦密码输入框
            passwordInput.focus();
            
            // 验证按钮事件
            function attemptVerify() {
                const password = passwordInput.value.trim();
                if (!password) {
                    errorMessage.textContent = "请输入密码";
                    return;
                }
                
                try {
                    // 尝试解密API密钥
                    const decryptedKey = CryptoJS.AES.decrypt(encryptedApiKey, password).toString(CryptoJS.enc.Utf8);
                    
                    if (decryptedKey && decryptedKey.length > 10) {
                        // 解密成功
                        apiKey = decryptedKey;
                        document.body.removeChild(modal);
                        resolve(true);
                    } else {
                        // 解密失败
                        errorMessage.textContent = "密码错误，请重试";
                        passwordInput.value = "";
                        passwordInput.focus();
                    }
                } catch (e) {
                    errorMessage.textContent = "密码错误，请重试";
                    passwordInput.value = "";
                    passwordInput.focus();
                }
            }
            
            // 绑定事件
            verifyButton.addEventListener('click', attemptVerify);
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    attemptVerify();
                }
            });
        });
    }
    
    // 启动验证流程
    verifyPassword().then(success => {
        if (success) {
            console.log("验证成功！");
            // 可以在这里启动其他初始化
        }
    });
    
    // 自动调整输入框高度
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.scrollHeight > 200) {
            this.style.height = '200px';
        }
    });
    
    // 添加图片上传功能
    uploadButton.addEventListener('click', function() {
        imageUpload.click();
    });
    
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // 检查文件类型
            if (!file.type.match('image.*')) {
                alert('请上传图片文件');
                return;
            }
            
            // 检查文件大小（限制为4MB）
            if (file.size > 4 * 1024 * 1024) {
                alert('图片大小不能超过4MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // 保存base64图片数据
                currentImage = e.target.result;
                
                // 显示预览
                showImagePreview(currentImage);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 显示图片预览
    function showImagePreview(imageData) {
        // 移除之前的预览
        const oldPreview = document.querySelector('.image-preview');
        if (oldPreview) {
            oldPreview.remove();
        }
        
        // 创建新的预览区域
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview';
        
        const previewImage = document.createElement('img');
        previewImage.src = imageData;
        previewImage.alt = "上传的图片";
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image';
        removeButton.innerHTML = '<i class="ri-close-line"></i>';
        removeButton.addEventListener('click', function() {
            previewContainer.remove();
            currentImage = null;
            imageUpload.value = '';
            document.querySelector('.input-container').classList.remove('with-preview');
        });
        
        previewContainer.appendChild(previewImage);
        previewContainer.appendChild(removeButton);
        
        // 添加到输入区域
        const inputContainer = document.querySelector('.input-container');
        inputContainer.classList.add('with-preview');
        inputContainer.insertBefore(previewContainer, inputContainer.firstChild);
    }
    
    // 发送消息处理
    sendButton.addEventListener('click', function() {
        sendMessage();
    });
    
    // 按Enter键发送消息，按Shift+Enter换行
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 新对话按钮
    newChatButton.addEventListener('click', function() {
        // 清空聊天窗口
        while (chatContainer.firstChild) {
            if (chatContainer.firstChild.classList && chatContainer.firstChild.classList.contains('welcome-message')) {
                break;
            }
            chatContainer.removeChild(chatContainer.firstChild);
        }
        
        // 添加欢迎消息
        if (!document.querySelector('.welcome-message')) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'welcome-message';
            welcomeMessage.innerHTML = `
                <h2>欢迎使用 <span class="gradient-text">清言AI</span></h2>
                <p>清言AI 支持 Google Gemini 2.0 Flash 模型，让您体验流畅智能的对话。</p>
                <div class="features-grid">
                    <div class="feature">
                        <i class="ri-brain-line"></i>
                        <span>强大的推理能力</span>
                    </div>
                    <div class="feature">
                        <i class="ri-message-3-line"></i>
                        <span>自然流畅对话</span>
                    </div>
                    <div class="feature">
                        <i class="ri-image-line"></i>
                        <span>图像理解能力</span>
                </div>
            </div>
        `;
            chatContainer.appendChild(welcomeMessage);
        }
        
        // 重置历史记录
        chatHistory = [];
        
        // 清除上传的图片
        currentImage = null;
        const oldPreview = document.querySelector('.image-preview');
        if (oldPreview) {
            oldPreview.remove();
        }
    });
    
    // 切换主题
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        const icon = this.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('ri-sun-line');
            icon.classList.add('ri-moon-line');
        } else {
            icon.classList.remove('ri-moon-line');
            icon.classList.add('ri-sun-line');
        }
    });
    
    // 发送消息主函数
    function sendMessage() {
        const message = userInput.value.trim();
        
        // 检查是否有内容可发送（文本或图片）
        if (!message && !currentImage) return;
        
        // 添加用户消息到界面
        let userContent = message;
        
        // 如果有图片，添加图片内容
        if (currentImage) {
            userContent = `<div class="message-image-container"><img src="${currentImage}" alt="用户图片" class="message-image"></div>${message ? message : ''}`;
        }
        
        // 添加用户消息到界面
        addMessageToChat('user', userContent);
        
        // 清空输入框并重置高度
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // 添加机器人响应（先是加载中状态）
        const botMessageElement = addMessageToChat('bot', '<div class="typing-indicator"><span></span><span></span><span></span></div>');
        
        // 处理发送逻辑
        processSendMessage(message, currentImage, botMessageElement);
        
        // 清除当前图片
        currentImage = null;
        const oldPreview = document.querySelector('.image-preview');
        if (oldPreview) {
            oldPreview.remove();
        }
    }
    
    // 处理消息发送和API调用
    async function processSendMessage(message, image, botMessageElement) {
        try {
            // 检查API密钥是否已验证
            if (!apiKey) {
                const verified = await verifyPassword();
                if (!verified) {
                    updateBotMessage(botMessageElement, "需要验证密钥才能继续。");
                    return;
                }
            }
            
            // 添加用户消息到历史记录
            const userParts = [];
            
            if (message) {
                userParts.push({ text: message });
            }
            
            if (image) {
                userParts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: image.split(',')[1] // 去掉base64前缀
                    }
                });
            }
            
            chatHistory.push({
                role: "user",
                parts: userParts
            });
            
            // 调用API获取响应
            await fetchAIResponse(message, image, botMessageElement);
            
        } catch (error) {
            console.error("处理消息时出错:", error);
            updateBotMessage(botMessageElement, "抱歉，处理您的消息时出现了错误: " + error.message);
        }
    }
    
    // 添加消息到聊天窗口
    function addMessageToChat(sender, content) {
        // 移除欢迎消息
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            chatContainer.removeChild(welcomeMessage);
        }
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        const avatar = document.createElement('div');
        avatar.className = sender === 'user' ? 'avatar user-avatar' : 'avatar bot-avatar';
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="ri-user-3-line"></i>';
        }
        
        const message = document.createElement('div');
        message.className = sender === 'user' ? 'message user-message' : 'message bot-message';
        message.innerHTML = content;
        
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(message);
        chatContainer.appendChild(messageContainer);
        
        // 自动滚动到底部
        scrollToBottom();
        
        return message;
    }
    
    // 更新机器人消息
    function updateBotMessage(element, text, reasoning = "") {
        // 处理markdown和代码高亮
        let htmlContent = marked.parse(text);
        
        // 创建响应内容的容器
        const responseContainer = document.createElement('div');
        responseContainer.className = 'response-container';
        
        // 设置正式回复内容
        const formalResponse = document.createElement('div');
        formalResponse.className = 'formal-response';
        formalResponse.innerHTML = htmlContent;
        responseContainer.appendChild(formalResponse);
        
        // 添加推理内容（如果有）
        if (reasoning && reasoning.trim()) {
            const reasoningContainer = document.createElement('div');
            reasoningContainer.className = 'reasoning-content';
            const reasoningHeader = document.createElement('h4');
            reasoningHeader.innerText = '思考过程';
            reasoningContainer.appendChild(reasoningHeader);
            reasoningContainer.innerHTML += marked.parse(reasoning);
            responseContainer.appendChild(reasoningContainer);
        }
        
        // 更新消息元素
        element.innerHTML = "";
        element.appendChild(responseContainer);
        
        // 处理代码高亮
            element.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        
        // 为图片添加查看器功能
        setTimeout(addImageViewerFunctionality, 100);
    }
    
    // 滚动到底部
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // 调用Google Gemini API - 支持多模态输入
    async function fetchAIResponse(textPrompt, imageData, botMessageElement) {
        if (!apiKey) {
            updateBotMessage(botMessageElement, "请先验证API密钥");
            return;
        }
        
        // 先显示连接中状态
        updateBotMessage(botMessageElement, "正在连接到Gemini API...");
        
        try {
            // 使用tech-shrimp/gemini-playground项目的代理API
            const apiUrl = "https://play.210718.xyz/v1/chat/completions";
            
            console.log("正在连接到Gemini代理服务:", apiUrl);
            
            // 构建OpenAI格式的请求
            const requestData = {
                model: "gemini-2.0-flash-exp",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业、友好、有帮助的AI助手。请使用中文回答问题，并提供准确、有价值的信息。当用户提供图片时，请仔细分析图片内容并给出详细、准确的描述和回答。"
                    }
                ],
                temperature: 0.7,
                stream: true
            };
            
            // 添加历史消息（不含当前消息）
            for (let i = 0; i < chatHistory.length - 1; i++) {
                const msg = chatHistory[i];
                
                // 创建OpenAI格式的消息
                const openAIMsg = {
                    role: msg.role === "model" ? "assistant" : msg.role,
                    content: []
                };
                
                // 添加内容部分
                msg.parts.forEach(part => {
                    if (part.text) {
                        openAIMsg.content.push({
                            type: "text",
                            text: part.text
                        });
                    } else if (part.inlineData) {
                        openAIMsg.content.push({
                            type: "image_url",
                            image_url: {
                                url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                            }
                        });
                    }
                });
                
                // 如果内容只有一个文本项，简化为字符串
                if (openAIMsg.content.length === 1 && openAIMsg.content[0].type === "text") {
                    openAIMsg.content = openAIMsg.content[0].text;
                }
                
                requestData.messages.push(openAIMsg);
            }
            
            // 添加当前用户消息
            const currentMsg = {
                role: "user",
                content: []
            };
            
            // 添加文本部分（如果有）
            if (textPrompt) {
                currentMsg.content.push({
                    type: "text",
                    text: textPrompt
                });
            }
            
            // 添加图片部分（如果有）
            if (imageData) {
                currentMsg.content.push({
                    type: "image_url",
                    image_url: {
                        url: imageData
                    }
                });
            }
            
            // 如果内容只有一个文本项，简化为字符串
            if (currentMsg.content.length === 1 && currentMsg.content[0].type === "text") {
                currentMsg.content = currentMsg.content[0].text;
            }
            
            requestData.messages.push(currentMsg);
            
            console.log("发送请求数据:", JSON.stringify(requestData).substring(0, 150) + "...");
            
            // 发送请求
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status}, ${errorText}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let responseText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data:') && line.trim() !== 'data:' && line.trim() !== 'data: [DONE]') {
                        try {
                            const jsonStr = line.substring(5).trim();
                            const data = JSON.parse(jsonStr);
                            
                            if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                                responseText += data.choices[0].delta.content;
                                updateBotMessage(botMessageElement, responseText);
                            }
                        } catch (e) {
                            console.error("解析响应数据错误:", e, line);
                        }
                    }
                }
            }

            // 确保最终更新UI
            updateBotMessage(botMessageElement, responseText);
            
            // 将AI回复添加到历史记录
            if (responseText.trim()) {
                chatHistory.push({
                    role: "model",
                    parts: [{ text: responseText }]
                });
            }
            
            return responseText;
        } catch (error) {
            console.error("API请求错误:", error);
            updateBotMessage(botMessageElement, 
                "## 连接失败\n\n无法连接到Gemini API。\n\n" +
                "详细错误信息: " + error.message
            );
            
            // 尝试备用API
            tryFallbackAPI(textPrompt, botMessageElement);
        }
    }

    // 尝试使用备用API
    async function tryFallbackAPI(prompt, botMessageElement) {
        try {
            console.log("尝试使用备用API...");
            
            // 备用API端点 - 可以尝试其他端点
            const fallbackApiUrl = "https://gemini-proxy.betalabs.dev/";
            
            // 构建简化的请求数据
            const simplifiedRequest = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                model: "gemini-pro",
                stream: false,
            };
            
            // 发送备用请求
            const response = await fetch(fallbackApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(simplifiedRequest)
            });
            
            if (!response.ok) {
                throw new Error(`备用API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const backupResponse = data.candidates[0].content.parts[0].text;
                updateBotMessage(botMessageElement, 
                    backupResponse + "\n\n---\n\n*注意：此回复来自备用API*"
                );
                
                // 将备用回复添加到历史记录
                chatHistory.push({
                    role: "model",
                    parts: [{ text: backupResponse }]
                });
            } else {
                throw new Error("备用API响应格式不正确");
            }
        } catch (error) {
            console.error("备用API请求也失败了:", error);
            // 已经显示了主API的错误信息，这里不再覆盖
        }
    }

    // 修改输入区域的HTML结构
    const inputContainer = document.querySelector('.input-container');
    const oldTextarea = document.getElementById('user-input');
    const oldButtonsContainer = document.querySelector('.input-buttons');
    
    // 创建一个新的行容器
    const inputRow = document.createElement('div');
    inputRow.className = 'input-row';
    
    // 移动现有元素到新容器
    inputContainer.removeChild(oldTextarea);
    if (oldButtonsContainer) {
        inputContainer.removeChild(oldButtonsContainer);
    }
    
    inputRow.appendChild(oldTextarea);
    if (oldButtonsContainer) {
        inputRow.appendChild(oldButtonsContainer);
    }
    
    // 将新容器添加到输入区域
    inputContainer.appendChild(inputRow);

    // 添加图片全屏查看功能
    function addImageViewerFunctionality() {
        document.querySelectorAll('.message-image').forEach(img => {
            if (!img.hasAttribute('data-has-viewer')) {
                img.setAttribute('data-has-viewer', 'true');
                img.style.cursor = 'zoom-in';
                
                img.addEventListener('click', function() {
                    const fullscreenContainer = document.createElement('div');
                    fullscreenContainer.className = 'fullscreen-image';
                    
                    const fullscreenImg = document.createElement('img');
                    fullscreenImg.src = img.src;
                    
                    fullscreenContainer.appendChild(fullscreenImg);
                    document.body.appendChild(fullscreenContainer);
                    
                    fullscreenContainer.addEventListener('click', function() {
                        document.body.removeChild(fullscreenContainer);
                    });
                });
            }
        });
    }
});