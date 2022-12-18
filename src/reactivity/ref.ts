import { hasChange, isObject } from "../shared"
import { isTracking, trackEffects, triggerEffect } from "./effect"
import { reactive } from "./reactive"

class RefImpl{
    private _value: any
    private rawValue: any
    public dep
    public __v_isRef=true
    constructor(value){
        // look value 是否 is object
        // this._value=value
        this._value=convert(value)// this._value=isObject(value)?reactive(value):value
        this.rawValue=value
        this.dep=new Set()
    }
    get value(){
        trackRefValue(this)
        return this._value
    }
    set value(newValue){
        // 一定先修改 value
        // newValue -> this._value
        // if(hasChange(newValue,this._value)){ // because reactive() reutrn Proxy so this._value maybe is prototype
        if(hasChange(newValue,this.rawValue)){
            this.rawValue=newValue
            // this._value=newValue
            this._value=convert(newValue)// this._value=isObject(newValue)?reactive(newValue):newValue
            triggerEffect(this.dep)
        }

    }
}

function convert(value){
    return isObject(value)?reactive(value):value
}

function trackRefValue(ref){
    if(isTracking()){
        trackEffects(ref.dep)
    }
}

export function ref(value){
    return new RefImpl(value)
}

export function isRef(ref){
    return !!ref.__v_isRef
}

export function unRef(ref){
    // look ref 是不是 ref ? return value : return ref
    return isRef(ref)?ref.value:ref
}

export function proxyRefs(objectWithRef){
    return new Proxy(objectWithRef,{
        get(target,key){
            // key yes ref return .value
            // key no ref return value
            return unRef( Reflect.get(target,key) )
        },
        set(target,key,value){
            if(isRef(target[key]) && !isRef(value)){// key yes ref && value no ref
                return target[key].value=value// set .value
            }else{// key no ref && value yes ref
                return Reflect.set(target,key,value)
            }
        }
    })
}
