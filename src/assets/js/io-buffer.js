class IOBuffer {
    constructor(options) {
        this.dataTables = options.dataTables;
        this.dataTableHex = options.dataTableHex;
        this.dataTableInfoLock = options.dataTableInfoLock;
        this.dataTableInfoDirection = options.dataTableInfoDirection;
        this.dataTableAscii = options.dataTableAscii;
        this.dataTableInfoHex = options.dataTableInfoHex;
        this.dataTableInfoDec = options.dataTableInfoDec;
        this.dataTableInfoBin = options.dataTableInfoBin;
        this.dataTableInfoAscii = options.dataTableInfoAscii;
        this.dataTableInfoDetail = options.dataTableInfoDetail;

        this.size = options.bufferSize;
        this.rowLength = options.rowLength;

        this.cellsSize = this.size + this.rowLength;
        this.buffer = new Array(this.size);
        this.cells = new Array(this.cellsSize);
        this.head = 0;
        this.tail = 0;
        this.rowOffset = 0;
        this.releaseNodes = [];
        this.classes = {
            in: 'cell-in',
            out: 'cell-out',
            init: 'cell',
        };

        this.escapeChars = [
            { value: 'NUL', label: 'NULL character' },
            { value: 'SOH', label: 'Start of Heading' },
            { value: 'STX', label: 'Start of Text' },
            { value: 'ETX', label: 'End of Text' },
            { value: 'EOT', label: 'End of Transmission' },
            { value: 'ENQ', label: 'Enquiry' },
            { value: 'ACK', label: 'Acknowledge' },
            { value: 'BEL', label: 'Bell' },
            { value: 'BS', label: 'Backspace' },
            { value: 'HT', label: 'Horizontal Tab' },
            { value: 'LF', label: 'Line feed' },
            { value: 'VT', label: 'Vertical Tab' },
            { value: 'FF', label: 'Form Feed' },
            { value: 'CR', label: 'Carriage return' },
            { value: 'SO', label: 'Shift Out' },
            { value: 'SI', label: 'Shift In' },
            { value: 'DLE', label: 'Data Link Escape' },
            { value: 'DC1', label: 'Device Control (XOn)' },
            { value: 'DC2', label: 'Device Control' },
            { value: 'DC3', label: 'Device Control (XOff)' },
            { value: 'DC4', label: 'Device Control' },
            { value: 'NAK', label: 'Negative Acknowledge' },
            { value: 'SYN', label: 'Synchronous Idle' },
            { value: 'ETB', label: 'End of Transmission Block' },
            { value: 'CAN', label: 'Cancel' },
            { value: 'EM', label: 'End of Medium' },
            { value: 'SUB', label: 'Substitute' },
            { value: 'ESC', label: 'Escape' },
            { value: 'FS', label: 'File Separator' },
            { value: 'GS', label: 'Group Separator' },
            { value: 'RS', label: 'Record Separator' },
            { value: 'US', label: 'Unit Separator' },
        ];
        this.prepareTableCells();
    }

    prepareTableCells() {
        for (let index = 0; index < this.cellsSize; index++) {
            const hexCell = document.createElement('div');
            const asciiCell = document.createElement('div');
            this.dataTableHex.appendChild(hexCell);
            this.dataTableAscii.appendChild(asciiCell);
            this.cells[index] = {
                nodeHex: hexCell,
                nodeAscii: asciiCell,
            };
        }
        this.reset();
    }

    reset() {
        this.head = 0;
        this.tail = 0;
        this.rowOffset = 0;
        this.cells.forEach((cell, index) => {
            cell.dir = 'init';
            cell.nodeHex.dataset.index = index;
            cell.nodeHex.className = 'cell';
            cell.nodeHex.textContent = '  ';
            cell.nodeAscii.dataset.index = index;
            cell.nodeAscii.className = 'cell';
            cell.nodeAscii.textContent = ' ';
            cell.value = null;
        });
    }

    push(data, dir) {
        const now = Date.now();
        for (let i = 0; i < data.length; i++) {
            this.buffer[this.tail] = {
                data: data[i],
                ts: now,
                dir,
            };
            this.tail = (this.tail + 1) % this.size;
            if (this.tail === this.head) {
                this.head = (this.head + 1) % this.size;
            }
        }
        this.rowOffset = (this.rowOffset + data.length) % this.rowLength;
    }

    getCellClassName(cell) {
        let className = cell.highlight ? 'cell-highlight' : this.classes[cell.dir];
        if (cell.value !== null && cell.value < 32) {
            className = `${className}-escape`;
        }
        return className;
    }

    updateCell(index, dir, value) {
        const cell = this.cells[index];

        if (cell.value !== value) {
            cell.nodeHex.textContent = value === null ? '  ' : value.toString(16).toUpperCase().padStart(2, '0');

            if (value === null) {
                cell.nodeAscii.textContent = ' ';
            } else if (value < 32) {
                cell.nodeAscii.innerHTML = this.escapeChars[value].value;
            } else {
                cell.nodeAscii.textContent = String.fromCharCode(value);
            }
            cell.value = value;
        }

        if (cell.dir !== dir) {
            cell.dir = dir;
        }

        const className = this.getCellClassName(cell);
        if (cell.nodeHex.className !== className) {
            cell.nodeHex.className = className;
            cell.nodeAscii.className = className;
        }
    }

    showInfo(value, dir) {
        this.dataTableInfoDirection.textContent = dir === 'init' ? '' : dir.toUpperCase();
        this.dataTableInfoHex.textContent = value.toString(16).toUpperCase().padStart(2, '0');
        this.dataTableInfoDec.textContent = value.toString(10);
        this.dataTableInfoBin.textContent = value.toString(2).padStart(8, '0');
        this.dataTableInfoAscii.textContent = value < 32 ? this.escapeChars[value].value : String.fromCharCode(value);
        this.dataTableInfoDetail.textContent = value < 32 ? this.escapeChars[value].label : '';
        this.dataTableInfoLock.style.display = this.freezedCellInfo ? 'block' : 'none';
    }

    cleanInfo() {
        this.dataTableInfoDirection.textContent = '';
        this.dataTableInfoHex.textContent = '';
        this.dataTableInfoDec.textContent = '';
        this.dataTableInfoBin.textContent = '';
        this.dataTableInfoAscii.textContent = '';
        this.dataTableInfoDetail.textContent = '';
        this.dataTableInfoLock.style.display = 'none';
    }

    highlightCell(index, state) {
        const cell = this.cells[index];
        cell.highlight = state;
        const className = this.getCellClassName(cell);
        cell.nodeHex.className = className;
        cell.nodeAscii.className = className;

        if (this.freezedCellInfo) {
            return;
        }

        if (state && cell.value !== null) {
            this.showInfo(cell.value, cell.dir);
        } else {
            this.cleanInfo();
        }
    }

    freezeCellInfo(index) {
        const cell = this.cells[index];
        this.freezedCellInfo = true;
        this.showInfo(cell.value, cell.dir);
        this.dataTableInfoLock.style.display = 'block';
    }

    unfreezeCellInfo() {
        this.freezedCellInfo = false;
        this.cleanInfo();
        this.dataTableInfoLock.style.display = 'none';
    }

    redraw() {
        let index = this.head;
        let cellIndex = 0;
        if (this.head !== 0) {
            for (let i = 0; i < this.rowOffset; i++) {
                this.updateCell(cellIndex, 'init', null);
                cellIndex++;
            }
        }

        while (index !== this.tail) {
            const item = this.buffer[index];
            this.updateCell(cellIndex, item.dir, item.data);
            index = (index + 1) % this.size;
            cellIndex++;
        }

        const cellsLeft = this.rowLength - (cellIndex % this.rowLength);
        for (let i = 0; i < cellsLeft; i++) {
            this.updateCell(cellIndex, 'init', null);
            cellIndex++;
        }
    }

    resize(newHeight) {
        this.dataTables.style.height = `${newHeight - 60}px`;
        this.dataTables.scrollTop = this.dataTables.scrollHeight;
    }
}
