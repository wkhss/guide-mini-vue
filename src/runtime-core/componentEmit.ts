import { camelize, toHandlerKey } from "../shared";

export function emit(instance,event,...args){
    console.log(event);
    
    // instance.props -> event
    const {props}=instance

    // TPP
    // 先写一个特定的行为 -> 重构成通用的行为
    
    // 特定行为
    // const handler=props['onAdd']
    // handler && handler()

    // 通用行为
    // add-foo -> addFoo
    // add -> Add
    const handlerName=toHandlerKey(camelize(event))
    const handler=props[handlerName]
    handler && handler(...args)
}