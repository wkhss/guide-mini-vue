import { ReactiveEffect } from "./effect"

class ComputedRefImpl{
    private _getter: any
    private _dirty: boolean=true
    private _value: any
    private _effect: any
    constructor(getter){
        this._getter=getter
        this._effect=new ReactiveEffect(getter,()=>{
            if(!this._dirty){
                this._dirty=true
            }
        })// 引入 effect 实例 收集依赖
    }
    get value(){
        if(this._dirty){// 是否是 再一次
            this._dirty=false
            // this._value=this._getter()
            this._value=this._effect.run()
        }
        return this._value
    }
}

export function computed(getter){
    return new ComputedRefImpl(getter)
}