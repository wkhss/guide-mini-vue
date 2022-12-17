import { hasChange, isObject } from "../shared"
import { isTracking, trackEffects, triggerEffect } from "./effect"
import { reactive } from "./reactive"

class RefImpl{
    private _value: any
    private rawValue: any
    public dep
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
