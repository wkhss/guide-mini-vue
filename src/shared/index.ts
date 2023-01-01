
export const extend = Object.assign

export const EMPTY_OBJECT={}

export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}

export const hasChange = (val, newVal) => {
    return !Object.is(val, newVal)
}


export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

// add-foo -> addFoo
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c: string) => {// _ => -(\w) c => (\w)
        return c ? c.toUpperCase() : ""
    })
}
// add -> Add
const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
export const toHandlerKey = (str: string) => {
    return str ? 'on' + capitalize(str) : ''
}