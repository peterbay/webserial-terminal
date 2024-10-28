## WebSerial TERMINAL

is a terminal emulator that allows you to connect to a serial device from your web browser.

Based on the WebSerial API and xterm.js.

### Online version
[terminal.vavrin.eu](https://terminal.vavrin.eu/)

### Features

-   Connect to a serial device from your web browser

    -   Predefined baud rates - 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
    -   Default baud rate is 115200
    -   The last used baud rate is saved in the local storage

-   Adjustable font size

    -   From 10 to 40
    -   Default is 15
    -   The last used font size is saved in the local storage
    -   Font size can be changed using these methods:
        -   `Ctrl + Mouse Wheel` inside terminal to decrease or increase font size
        -   `Mouse Wheen` inside font size input to decrease or increase font size
        -   Clicking on minus or plus button to decrease or increase font size

-   Send keystrokes to the connected device and receive responses

-   Button `Ctrl+C` to send the break signal

-   Button `Ctrl+D` to send the end of transmission signal

-   Button `Scroll to bottom` to scroll to the bottom of the terminal

-   Button `Show Buffer` to show the buffer of the terminal

    -   The buffer is limited to 512 bytes
    -   The buffer is circular and the oldest data is overwritten by the newest data
    -   The buffer shows hexadecimal and ASCII representation of the data
    -   Values with yellow text color or background are the control characters
    -   Values with black background are read bytes
    -   Values with colored background and black text are written bytes
    -   When mouse hovers over the buffer cell, the hexadecimal and ASCII representation is highlighted and value is shown in the top bar
    -   When mouse double clicks on the buffer cell, then value is freezed
    -   When mouse clicks on the buffer cell, then value is unfreezed

-   Button `Reset stats` to reset the statistics about read and written bytes

### Build

-   Clone the repository
-   Run `yarn install` or `npm install`
-   Run `yarn build` or `npm run build`
-   In `dist` folder, you can find these folders:
    -   `default` - separated local and remote assets
    -   `single-file` - contains all local and remote assets in one file
    -   `single-file-with-remote-assets` - contains all local in one file, remote assets are loaded from the web

### Run

-   You can run the terminal by opening the `index.html` file in your browser from the `dist` folders.
-   Or you can run it from a HTTPS server/webhosting.
-   You can copy `index.html` from `dist/single-file` folder to your microcontroller and run the terminal from there even without internet connection.

### Resources

-   [WebSerial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
-   [xterm.js](https://xtermjs.org/)
