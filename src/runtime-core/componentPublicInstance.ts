import { hasOwn } from "../shared"

const publicProperitesMap={
    $el:(i)=>i.vnode.el
}

export const PublicInstanceProxyHandlers={
        get({_:instance},key){
            const {setupState,props}=instance
            // if(key in setupState){
            //     return setupState[key]
            // }
            if(hasOwn(setupState,key)){
                return setupState[key]
            }else if(hasOwn(props,key)){
                return props[key]
            }
            const publicGetter=publicProperitesMap[key]
            if(publicGetter){
                return publicGetter(instance)
            }
            // if(key === '$el'){
            //     return instance.vnode.el
            // }
        }
    }
