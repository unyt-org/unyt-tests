[![NPM version](https://badgen.net/npm/v/ginlibs-utils)](https://www.npmjs.com/package/ginlibs-utils)
[![NPM Weekly Downloads](https://badgen.net/npm/dw/ginlibs-utils)](https://www.npmjs.com/package/ginlibs-utils)
[![License](https://badgen.net/npm/license/ginlibs-utils)](https://www.npmjs.com/package/ginlibs-utils)

# ginlibs-utils

> 检查数据类型的工具函数

## 安装

```sh
npm i ginlibs-utils --save
```

## 使用例子

```js
import { isNumber, isNumeric } from 'ginlibs-utils'

isNumber(0) // true
isNumber('1') // false
isNumber(NaN) // false
isNumber(Infinity) // false

isNumeric('1') // true
isNumeric('-1') // true
isNumeric('1.2') // true
isNumeric('-1.2e1') // true
isNumeric('a') // false
```

## API

### `isString(val)`

> 判断是否是字符串

```js
isString('1') // true
isString('') // true
```

### `isBoolean(val)`

> 判断是否是布尔值

```js
isBoolean(false) // true
isBoolean(0) // false
```

### `isNumber(val)`

> 判断是否是数字

```js
isNumber(0) // true
isNumber('1') // false
isNumber(NaN) // false
isNumber(Infinity) // false
```

### `isNumeric(val)`

> 判断是否是数字字符串

```js
isNumeric('1') // true
isNumeric('-1') // true
isNumeric('1.2') // true
isNumeric('-1.2e1') // true
isNumeric('a') // false
```

### `isNull(val)`

> 判断是否是 null

```js
isNull(null) // true
isNull(undefined) // false
isNull(0) // false
```

### `isNilVal(val)`

> 判断是否是 null 或者 undefined

```js
isNilVal(false) // true
isNilVal(undefined) // true
isNilVal(0) // false
isNilVal('') // false
```

### `isArray(val)`

> 判断是否是数组

```js
isArray([]) // true
isArray({}) // false
```

### `isObject(val)`

> 判断是否是对象

```js
isObject({}) // true
isObject([]) // false
isObject(null) // false
```

### `isFunc(val)`

> 判断是否是函数

```js
isFunc(() => {}) // true
isFunc({}) // false
```

### `isPromise(val)`

> 判断是否是 Promise 对象

```js
isPromise(new Promise(() => {}))) // true
isPromise(()=>{}) // false
isPromise({}) // false
```

### `isDate(val)`

> 判断是否是有效的 Date 对象

```js
isDate(new Date(1))) // true
isDate(new Date('a')) // false
```
