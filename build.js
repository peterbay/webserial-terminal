const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { minify } = require('html-minifier-terser');

async function inlineAsset(html, params) {
    let asset;
    const filePath = params.path.startsWith('http') ? params.path : path.join(params.sourceFolder, params.path);

    if (fs.existsSync(filePath)) {
        if (!params.inlineLocalAssets) {
            if (filePath.includes('assets')) {
                const assetPath = path.join(filePath.split('assets')[1]);
                const targetPath = path.join(params.targetFolder, assetPath);
                const targetFolder = path.dirname(targetPath);
                const htmlAssetPath = `.${assetPath.replace(/\\/g, '/')}`;

                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder, { recursive: true });
                }

                fs.copyFileSync(filePath, targetPath);

                if (params.originalTag.toLowerCase() === 'link') {
                    html = html.replace(params.regex, `<link rel="stylesheet" href="${htmlAssetPath}" />`);
                } else if (params.originalTag.toLowerCase() === 'script') {
                    html = html.replace(params.regex, `<script src="${htmlAssetPath}"></script>`);
                }
            }

            return html;
        }
        asset = fs.readFileSync(filePath, 'utf8');
    } else {
        if (!params.inlineRemoteAssets) {
            return html;
        }
        asset = (await axios.get(filePath)).data;
    }

    return html.replace(params.regex, `<${params.tag}>\n${asset}\n</${params.tag}>`);
}

function cleanTargetPath(targetDir) {
    if (!fs.existsSync(targetDir)) {
        return;
    }

    fs.readdirSync(targetDir).forEach((file) => {
        const entryPath = path.join(targetDir, file);
        const stat = fs.lstatSync(entryPath);
        if (stat.isFile()) {
            fs.unlinkSync(entryPath);
        } else if (stat.isDirectory()) {
            cleanTargetPath(entryPath);
        }
    });
    fs.rmdirSync(targetDir);
}

async function inlineAssets(params) {
    const sourceFolder = params.sourceFolder;
    const targetFolder = params.targetFolder;

    console.log(`Inlining assets from ${sourceFolder} to ${targetFolder}`);

    const inputFile = path.join(sourceFolder, params.inputFile);
    const outputFile = path.join(targetFolder, 'index.html');

    let html = fs.readFileSync(inputFile, 'utf8');

    const inlineLocalAssets = params.inlineLocalAssets || false;
    const inlineRemoteAssets = params.inlineRemoteAssets || false;

    cleanTargetPath(targetFolder);

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Match and inline CSS links
    const cssLinks = [...html.matchAll(/<link[^>]*?\s+href=["'](.*?)["'][^>]*?>/gs)];
    for (const match of cssLinks) {
        html = await inlineAsset(html, {
            path: match[1],
            regex: match[0],
            originalTag: 'link',
            tag: 'style',
            sourceFolder,
            targetFolder,
            inlineLocalAssets,
            inlineRemoteAssets,
        });
    }

    // Match and inline JavaScript src
    const scriptLinks = [...html.matchAll(/<script[^>]*?\s+src=["'](.*?)["'][^>]*?>\s*<\/script>/gs)];
    for (const match of scriptLinks) {
        html = await inlineAsset(html, {
            path: match[1],
            regex: match[0],
            originalTag: 'script',
            tag: 'script',
            sourceFolder,
            targetFolder,
            inlineLocalAssets,
            inlineRemoteAssets,
        });
    }

    // Minify the HTML
    const minifiedHtml = await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
    });

    // Save the minified HTML file
    fs.writeFileSync(outputFile, minifiedHtml, 'utf8');
    console.log(`Saved minified HTML to ${outputFile}`);
}

const defaultBuild = {
    sourceFolder: './src',
    inputFile: './index.html',
    targetFolder: './dist/default',
    inlineLocalAssets: false,
    inlineRemoteAssets: false,
};

const singleFileWithRemoteAssets = {
    sourceFolder: './src',
    inputFile: './index.html',
    targetFolder: './dist/single-file-with-remote-assets',
    inlineLocalAssets: true,
    inlineRemoteAssets: false,
};

const singleFile = {
    sourceFolder: './src',
    inputFile: './index.html',
    targetFolder: './dist/single-file',
    inlineLocalAssets: true,
    inlineRemoteAssets: true,
};

inlineAssets(defaultBuild);
inlineAssets(singleFileWithRemoteAssets);
inlineAssets(singleFile);
