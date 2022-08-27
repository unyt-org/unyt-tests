[English](./README.md) | 简体中文

# delete-node-require-cache

[![NPM version](https://badgen.net/npm/v/delete-node-require-cache)](https://www.npmjs.com/package/delete-node-require-cache)
[![NPM Weekly Downloads](https://badgen.net/npm/dw/delete-node-require-cache)](https://www.npmjs.com/package/delete-node-require-cache)
[![License](https://badgen.net/npm/license/delete-node-require-cache)](https://www.npmjs.com/package/delete-node-require-cache)

> nodejs 加载 js 脚本会有缓存，这是基于性能考虑，但有时候我们需要 nodejs 能实时加载 js 脚本新的修改，这个包会把 js 脚本解析成 ast 语法树，分析里面的依赖的 js 脚本并且删除相关缓存

```js
import { delRequireCache } from 'delete-node-require-cache'

delRequireCache(jsFilePath)
```
