document.addEventListener('DOMContentLoaded', () => {
    const [
        app,
        terminalContainer,
        connectButton,
        selectSerialPortBaudrate,
        buttonCtrlC,
        buttonCtrlD,
        buttonScrollToBottom,
        buttonShowAbout,
        buttonShowBuffer,
        buttonResetStats,
        inputFontSize,
        buttonFontSizeMinus,
        buttonFontSizePlus,
        svgDevice,
        svgToDevice,
        svgFromDevice,
        transferStats,
        dataTableInfo,
        dataTables,
        dataTableHex,
        dataTableAscii,
        dataTableInfoLock,
        dataTableInfoDirection,
        dataTableInfoHex,
        dataTableInfoDec,
        dataTableInfoBin,
        dataTableInfoAscii,
        dataTableInfoDetail,
        terminalBackgroundText,
    ] = [
        'app',
        'terminal-container',
        'button-connect',
        'select-serial-port-baudrate',
        'button-ctrl-c',
        'button-ctrl-d',
        'button-scroll-to-bottom',
        'button-show-about',
        'button-show-buffer',
        'button-reset-stats',
        'input-font-size',
        'button-font-size-minus',
        'button-font-size-plus',
        'svg-device',
        'svg-to-device',
        'svg-from-device',
        'transfer-stats',
        'data-table-info',
        'data-tables',
        'data-table-hex',
        'data-table-ascii',
        'data-table-info-lock',
        'data-table-info-direction',
        'data-table-info-hex',
        'data-table-info-dec',
        'data-table-info-bin',
        'data-table-info-ascii',
        'data-table-info-detail',
        'terminal-background-text',
    ].map((id) => document.getElementById(id));

    // small animation on terminal background just for fun
    const backgroundDot = ['•', '•', '•'];
    const backgroundText = ['T', 'E', 'R', 'M', 'I', 'N', 'A', 'L'];

    function animationPhase(text, stepDelay, endDelay, callback) {
        terminalBackgroundText.textContent = '';
        const interval = setInterval(() => {
            terminalBackgroundText.textContent = terminalBackgroundText.textContent + text.shift();
            if (text.length) return;
            clearInterval(interval);
            if (endDelay && callback) {
                setTimeout(callback, endDelay);
            }
        }, stepDelay);
    }

    animationPhase(backgroundDot, 200, 400, () => {
        animationPhase(backgroundText, 70);
    });

    let port;
    let reader;
    let portReadedChars = 0;
    let portWritedChars = 0;
    let portLastReadedChars = 0;
    let portLastWritedChars = 0;
    let showAbout = false;
    let showDataBuffer = false;
    let lastHighlightIndex = null;

    const ioBufferOptions = {
        dataTables,
        dataTableHex,
        dataTableAscii,
        dataTableInfoLock,
        dataTableInfoDirection,
        dataTableInfoHex,
        dataTableInfoDec,
        dataTableInfoBin,
        dataTableInfoAscii,
        dataTableInfoDetail,
        bufferSize: 512,
        rowLength: 16,
    };

    const defaultConfig = {
        fontSize: 15,
        baudRate: 115200,
    };

    const ioBuffer = new IOBuffer(ioBufferOptions);
    const config = new Config(defaultConfig);
    
    inputFontSize.value = parseInt(config.get('fontSize'));
    selectSerialPortBaudrate.value = parseInt(config.get('baudRate'));

    const { Terminal } = window;
    const { FitAddon } = window.FitAddon;
    const terminal = new Terminal({
        scrollback: 1000,
        cursorBlink: true,
        fontFamily: '"Ubuntu Mono", Menlo, Consolas, "DejaVu Sans Mono", "Courier New", Courier, monospace',
        theme: {
            background: 'transparent',
            allowTransparency: true,
            //     selectionBackground: '#bbbbbb',
            //     selectionForeground: '#000000',
        },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.onTitleChange((title) => {
        document.title = title;
    });

    terminal.attachCustomKeyEventHandler((event) => {
        if (event.ctrlKey && (event.type === 'keydown' || event.type === 'keyup')) {
            let button = null;
            if (event.code === 'KeyC') {
                button = buttonCtrlC;
            } else if (event.code === 'KeyD') {
                button = buttonCtrlD;
            } else {
                return;
            }

            if (event.type === 'keydown') {
                button.classList.add('active');
            } else if (event.type === 'keyup') {
                button.classList.remove('active');
            }
        }
    });

    terminal.open(terminalContainer);
    fitAddon.fit();

    terminal.onResize(function () {
        ioBuffer.resize(terminalContainer.clientHeight);
    });

    terminal.onData(async (data) => {
        if (port && port.writable) {
            const writer = port.writable.getWriter();
            const chars = new TextEncoder().encode(data);
            portWritedChars += chars.length;
            ioBuffer.push(chars, 'out');
            await writer.write(chars);
            writer.releaseLock();
        }
    });

    if (navigator && 'serial' in navigator) {
        terminal.writeln('WebSerial Terminal - Click on "Connect to Serial" to start.');
    } else {
        terminal.writeln('Terminal error: WebSerial not supported');
        terminal.writeln('Please use a browser that supports it.');
        terminal.writeln(
            'Supported browsers: Chrome 89+, Edge 89+, Opera 75+ and other browsers based on Chromium 89+.'
        );
    }

    function updateToolbar() {
        if (!navigator || !('serial' in navigator)) {
            connectButton.setAttribute('disabled', 'disabled');
        }
        const connected = !!port;

        connectButton.textContent = connected ? 'Disconnect' : 'Connect to Serial';
        buttonCtrlC.style.display = connected ? 'flex' : 'none';
        buttonCtrlD.style.display = connected ? 'flex' : 'none';
        buttonScrollToBottom.style.display = connected ? 'flex' : 'none';
        buttonShowBuffer.textContent = showDataBuffer ? 'Hide Buffer' : 'Show Buffer';

        if (connected) {
            selectSerialPortBaudrate.setAttribute('disabled', 'disabled');
        } else {
            selectSerialPortBaudrate.removeAttribute('disabled');
        }
    }

    async function sendToPort(data) {
        if (port && port.writable) {
            const writer = port.writable.getWriter();
            const chars = new TextEncoder().encode(data);
            portWritedChars += chars.length;
            ioBuffer.push(chars, 'out');
            await writer.write(chars);
            writer.releaseLock();
        }
    }

    function chageFontSize(delta) {
        let fontSize = parseInt(inputFontSize.value, 10);
        if (isNaN(fontSize)) {
            fontSize = config.get('fontSize');
        }
        if (delta !== undefined) {
            fontSize = delta < 0 ? fontSize + 1 : fontSize - 1;
        }
        fontSize = Math.max(10, Math.min(fontSize, 40));
        inputFontSize.value = fontSize;
        terminal.options.fontSize = fontSize;
        config.set('fontSize', fontSize);
        fitAddon.fit();
    }

    function changePortBaudrate() {
        const baudRate = parseInt(selectSerialPortBaudrate.value, 10);
        if (baudRate) {
            config.set('baudRate', baudRate);
        }
    }

    function highlightCell(event, state) {
        const target = event.target;
        if (lastHighlightIndex !== null) {
            ioBuffer.highlightCell(lastHighlightIndex, false);
            lastHighlightIndex = null;
        }
        if (target.tagName === 'DIV' && 'index' in target.dataset) {
            const index = parseInt(target.dataset.index, 10);
            ioBuffer.highlightCell(index, state);
            lastHighlightIndex = state ? index : null;
        }
    }

    function freeceCell(event) {
        const target = event.target;
        if (target.tagName === 'DIV' && 'index' in target.dataset) {
            const index = parseInt(target.dataset.index, 10);
            ioBuffer.freezeCellInfo(index);
        }
    }

    function unfreeceCell(event) {
        ioBuffer.unfreezeCellInfo();
        highlightCell(event, true);
    }

    async function sendCtrlC() {
        await sendToPort('\x03');
        terminal.focus();
    }

    async function sendCtrlD() {
        await sendToPort('\x04');
        terminal.focus();
    }

    async function scrollToBottom() {
        terminal.scrollToBottom();
        terminal.focus();
    }

    async function resetStats() {
        portReadedChars = 0;
        portWritedChars = 0;
        portLastReadedChars = 0;
        portLastWritedChars = 0;
    }

    function updateDataBufferVisibility() {
        dataTables.style.display = showDataBuffer ? 'flex' : 'none';
        dataTableInfo.style.display = showDataBuffer ? 'flex' : 'none';
        if (showDataBuffer) {
            ioBuffer.redraw();
        }
        updateToolbar();
    }

    function toggleAboutVisibility() {
        showAbout = !showAbout;
        about.style.display = showAbout ? 'block' : 'none';
    }

    function toggleDataBufferVisibility() {
        showDataBuffer = !showDataBuffer;
        updateDataBufferVisibility();
    }

    function onWindowClick(event) {
        if (showAbout && !about.contains(event.target) && !buttonShowAbout.contains(event.target)) {
            toggleAboutVisibility();
        }
    }

    function confirmExit() {
        return "You have attempted to leave this page. Are you sure?";
    }

    async function readFromPort() {
        const decoder = new TextDecoder('utf-8'); 
        try {
            reader = port.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    ioBuffer.push(value, 'in');
                    portReadedChars += value.length;
                    const chars = decoder.decode(value, { stream: true });
                    terminal.write(chars);
                }
            }
        } catch (err) {
            console.error(err);
            terminal.writeln(`Terminal error: reading from serial port.`);
        } finally {
           if (reader) { 
               reader.releaseLock();
           }
            disconnect(); 
        }
    }

    async function connect() {
        if (!port) {
            try {
                const baudRate = parseInt(selectSerialPortBaudrate.value, 10);
                if (!baudRate) {
                    terminal.writeln('Terminal error: Invalid baudrate');
                    return;
                }
                port = await navigator.serial.requestPort();
                await port.open({ baudRate });
                terminal.reset();
                terminal.focus();
                portReadedChars = 0;
                portWritedChars = 0;
                updateToolbar();
                readFromPort();
                window.onbeforeunload = confirmExit;

                port.addEventListener('disconnect', () => {
                    terminal.writeln('Terminal error: Serial port disconnected.');
                    disconnect();
                });
            } catch (err) {
                console.error(err);
                terminal.writeln(`Terminal error: Unable to connect to serial port.`);
            }
        } else {
            disconnect();
        }
    }

    async function disconnect() {
        if (reader) {
            try {
                await reader.cancel();
            } catch {}
            reader = null;
        }
        if (port) {
            try {
                await port.close();
            } catch {}
            port = null;
        }
        portReadedChars = 0;
        portWritedChars = 0;
        document.title = 'WebSerial Terminal';
        updateToolbar();
        ioBuffer.reset();
        window.onbeforeunload = null;
    }

    window.addEventListener('resize', () => fitAddon.fit());
    window.addEventListener('click', onWindowClick);
    terminalContainer.addEventListener('click', () => terminal.focus());
    connectButton.addEventListener('click', () => connect());
    buttonCtrlC.addEventListener('click', () => sendCtrlC());
    buttonCtrlD.addEventListener('click', () => sendCtrlD());
    buttonScrollToBottom.addEventListener('click', () => scrollToBottom());
    buttonShowAbout.addEventListener('click', () => toggleAboutVisibility());
    buttonShowBuffer.addEventListener('click', () => toggleDataBufferVisibility());
    buttonResetStats.addEventListener('click', () => resetStats());
    inputFontSize.addEventListener('change', () => chageFontSize());
    selectSerialPortBaudrate.addEventListener('change', () => changePortBaudrate());
    buttonFontSizeMinus.addEventListener('click', () => chageFontSize(1));
    buttonFontSizePlus.addEventListener('click', () => chageFontSize(-1));
    dataTableHex.addEventListener('mouseover', (event) => highlightCell(event, true));
    dataTableHex.addEventListener('mouseout', (event) => highlightCell(event, false));
    dataTableHex.addEventListener('dblclick', freeceCell);
    dataTableHex.addEventListener('click', unfreeceCell);
    dataTableAscii.addEventListener('mouseover', (event) => highlightCell(event, true));
    dataTableAscii.addEventListener('mouseout', (event) => highlightCell(event, false));
    inputFontSize.addEventListener('wheel', (event) => chageFontSize(event.deltaY), {
        passive: false,
    });

    terminalContainer.addEventListener(
        'wheel',
        (event) => {
            if (event.ctrlKey) {
                event.preventDefault();
                chageFontSize(event.deltaY);
            }
        },
        { passive: false }
    );

    updateDataBufferVisibility();
    updateToolbar();
    chageFontSize();
    ioBuffer.cleanInfo();
    ioBuffer.resize(terminalContainer.clientHeight);
    app.style.visibility = 'visible';

    setInterval(() => {
        const connected = !!port;
        svgToDevice.style.stroke = portWritedChars - portLastWritedChars > 0 ? '#aa1b1b' : '#313131';
        svgFromDevice.style.stroke = portReadedChars - portLastReadedChars > 0 ? '#15aa00' : '#313131';
        portLastReadedChars = portReadedChars;
        portLastWritedChars = portWritedChars;
        svgDevice.style.stroke = connected ? '#15aa00' : '#aa1b1b';
        transferStats.textContent = `Read: ${portReadedChars} bytes, Written: ${portWritedChars} bytes`;
        if (showDataBuffer) {
            ioBuffer.redraw();
        }
    }, 250);
});
