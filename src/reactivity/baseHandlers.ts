import { track, trigger } from "./effect"
import { ReactiveFlags } from "./reactive"

// 将代码抽离出 避免重复多次调用 损耗性能
const get=createGetter()
const set=createSetter()
const readonlyGet=createGetter(true)

function createGetter(isReadonly=false) {
    return function get(target,key){
        if(key===ReactiveFlags.IS_REACTIVE){
            return !isReadonly
        }else if(key===ReactiveFlags.IS_READONLY){
            return isReadonly
        }
        
        // target -> {foo:1}
        // key -> foo
        const res=Reflect.get(target,key)
        if(!isReadonly){
            // TODO 依赖收集
            track(target,key)
        }
        return res
    }
}

function createSetter(){
    return function set(target,key,value){
        const res=Reflect.set(target,key,value)
        // TODO 触发依赖
        trigger(target,key)
        return res
    }
}

export const mutableHandlers={
    get,
    set
}

export const readonlyHandlers={
    get:readonlyGet,
    set(target,key,value){
        // 返回 警告 提示 信息
        console.warn(`key:${key} set 失败 因为 target 是 readonly`)
        return true
    }
}
