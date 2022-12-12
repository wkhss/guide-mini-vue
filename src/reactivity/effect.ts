import { extend } from "../shared";

class ReactiveEffect{
    private _fn: any;
    deps=[];
    active=true;
    onStop?:()=>void;
    constructor(fn,public scheduler?){
        this._fn=fn
    }
    run(){
        reactiveEffect=this
        return this._fn()
    }
    stop(){
        // 优化 清除过后 不用再次清理
        if(this.active){
            cleanupEffect(this)
            if(this.onStop){
                this.onStop()
            }
            this.active=false
        }
    }
}

function cleanupEffect(effect){
    effect.deps.forEach(dep => {
        dep.delete(effect)// deps => Set() 因此 使用 delete() 删除
    });
}

const targetMap=new Map()
export function track(target,key){
    // target -> key -> dep
    let depsMap=targetMap.get(target)
    if(!depsMap){
        depsMap=new Map()
        targetMap.set(target,depsMap)
    }

    let dep=depsMap.get(key)
    if(!dep){
        dep=new Set()
        depsMap.set(key,dep)
    }

    if(!reactiveEffect) return // 当执行 effect() 时才会 使用到下面的代码

    dep.add(reactiveEffect)
    reactiveEffect.deps.push(dep)
}

export function trigger(target,key){
    const depsMap=targetMap.get(target)
    const dep=depsMap.get(key)
    for(const effect of dep){
        if(effect.scheduler){
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}

let reactiveEffect
export function effect(fn, options:any={}){
    const _effect=new ReactiveEffect(fn,options.scheduler)
    // options 对功能模块进行抽离 使其应用时更有寓意话
    extend(_effect,options)// _effect.onStop=options.onStop -> Object.assign(_effect,options) -> extend(_effect,options)
    
    _effect.run()

    const runner:any=_effect.run.bind(_effect)// run() 中存在 this 使用 bind() 将this指针 指向当前实例对象
    runner.effect=_effect

    return runner
}

export function stop(runner){
    runner.effect.stop()
}

