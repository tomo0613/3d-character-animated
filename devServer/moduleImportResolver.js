module.exports = {
    resolveImports,
};

const nodeModulesPath = '../node_modules';
const nodeModuleResolutions = {
    three: 'three/build/three.module',
};
const nodeModulesRegExp = new RegExp(`^(${Object.keys(nodeModuleResolutions).join('|')})`);
const importRegExp = /(import.+from) ('|")(.+)('|")/g;
const extensionRegExp = /\.js$/;

function resolveImports(fileContentString) {
    return fileContentString.replace(importRegExp, alterModuleResolution);
}

function alterModuleResolution(fullMatch, importDefinition, stringOpeningTag, importPath, stringClosingTag) {
    let path = importPath;
    if (nodeModuleResolutions[path]) {
        path = nodeModuleResolutions[path];
    }
    if (nodeModulesRegExp.test(path)) {
        path = `${nodeModulesPath}/${path}`;
    }
    if (!extensionRegExp.test(path)) {
        path = `${path}.js`;
    }

    return `${importDefinition} ${stringOpeningTag}${path}${stringClosingTag}`;
}
