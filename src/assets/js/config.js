class Config {
    constructor(defaults) {
        this.config = {};
        this.defaults = defaults;
        this.init();
    }

    init() {
        if (window.localStorage) {
            const storedConfig = localStorage.getItem('config');
            if (storedConfig) {
                try {
                    const storedConfigJSON = JSON.parse(storedConfig);
                    for (let key of Object.keys(storedConfigJSON)) {
                        if (storedConfigJSON[key] === null) {
                            continue;
                        }
                        this.config[key] = storedConfigJSON[key];
                    }
                } catch (error) {
                    console.error('Error parsing stored config');
                }
            }
        }

        for (const key in this.defaults) {
            if (!key in this.config) {
                this.config[key] = this.defaults[key];
            }
        }
    }

    saveConfig() {
        if (window.localStorage) {
            localStorage.setItem('config', JSON.stringify(this.config));
        }
    }

    get(key) {
        if (key in this.config) {
            return this.config[key];
        }
        if (key in this.defaults) {
            return this.defaults[key];
        }
        return null;
    }

    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
}
