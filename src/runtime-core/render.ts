import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT, isObject } from "../shared"
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent} from "./component"
import { createAppApi } from "./createApp";
import { Fragment,Text } from "./vnode";

export function createRender(options){
    const {
        createElement:hostCreateElement,
        patchProp:hostPatchProp,
        insert:hostInsert,
        remove:hostRemove,
        setElementText:hostSetElementText,
    }=options

    function render(vnode,rootContainer){
        patch(null,vnode,rootContainer,null)
    }

    // n1 old n2 new
    function patch(n1,n2,container:any,parentComponent){// patch() 用于递归处理component
        // 判断 是component 还是 element
        // vnode.type -> object || string
        // console.log(vnode.type);
        const { type, shapeFlags } = n2
        switch(type){
            case Fragment:
                processFragment(n1,n2,container,parentComponent)
            break;
            case Text:
                processText(n1,n2,container)
            break;
            default:
                if(ShapeFlags.ELEMENT & shapeFlags){
                    processElement(n1,n2,container,parentComponent)
                }else if(ShapeFlags.STATEFUL_COMPONENT & shapeFlags){
                    processComponent(n1,n2,container,parentComponent)
                }
            break;
        }
        /* if(typeof vnode.type==='string'){
            mountElement(vnode,container)
        }else if(isObject(vnode.type)){
            processComponent(vnode,container)
        } */
    }

    function processText(n1,n2,container:any){
        const {children}=n2
        const textVNode=(n2.el=document.createTextNode(children))
        container.append(textVNode)
    }

    function processFragment(n1,n2,container:any,parentComponent){
        mountChildren(n2.children,container,parentComponent)
    }

    function processElement(n1,n2,container:any,parentComponent){
        if(!n1){// n1 不存在 就是 初始化
            mountElement(n2,container,parentComponent)
        }else{
            patchElement(n1,n2,container,parentComponent)
        }
    }

    function patchElement(n1,n2,container,parentComponent){
        console.log('patchElement');
        console.log('n1',n1);
        console.log('n2',n2);

        const oldProps=n1.props || EMPTY_OBJECT
        const newProps=n2.props || EMPTY_OBJECT

        const el= ( n2.el = n1.el ) 
        
        patchChildren(n1,n2,el,parentComponent)
        patchProps(el,oldProps,newProps)
    }
    
    function patchChildren(n1,n2,container,parentComponent){
        const prevShapeFlags=n1.shapeFlags
        const c1=n1.children
        const {shapeFlags}=n2
        const c2=n2.children

        // new is text
        if(shapeFlags & ShapeFlags.TEXT_CHILDREN){
            if(prevShapeFlags & ShapeFlags.ARRAY_CHILDREN){// old is array
                // 1.把老的 children 清空
                unmountChildren(n1.children)
                // 2.设置 text
                // hostSetElementText(container,c2)
            }
            /*else{// old is text
                if(c1 !== c2){
                    hostSetElementText(container,c2)
                }
            } */
            if(c1 !== c2){// old is text
                hostSetElementText(container,c2)
            }
        }else{// new is array
            if(shapeFlags & ShapeFlags.ARRAY_CHILDREN){
                hostSetElementText(container,'')
                mountChildren(c2,container,parentComponent)
            }
        }
    }

    function unmountChildren(children){
        for(let i=0;i<children.length;i++){
            const el=children[i].el
            hostRemove(el)
        }
    }

    function patchProps(el,oldProps,newProps){
        if(oldProps !== newProps){
            for (const key in newProps) {
                const prevProp=oldProps[key]
                const nextProp=newProps[key]
                if(prevProp !== nextProp){
                    hostPatchProp(el,key,prevProp,nextProp)
                }
            }
            if(oldProps !== EMPTY_OBJECT){
                for (const key in oldProps) {
                    if(!( key in newProps )){
                        hostPatchProp(el,key,oldProps[key],null)
                    }
                }
            }
        }
    }

    function mountElement(vnode,container:any,parentComponent){
        // vnode -> element -> div
        // const el=(vnode.el=document.createElement(vnode.type))
        const el=(vnode.el=hostCreateElement(vnode.type))

        // children -> string || array
        const {children,shapeFlags}=vnode
        if(ShapeFlags.TEXT_CHILDREN & shapeFlags){
            el.textContent=children
        }else if(ShapeFlags.ARRAY_CHILDREN & shapeFlags){
            mountChildren(vnode.children,el,parentComponent)
        }
        /* if(typeof children==='string'){
            el.textContent=children
        }else if(Array.isArray(children)){
            mountChildren(vnode,el)
        } */

        // props
        const {props}=vnode
        for(let key in props){
            const val=props[key]
            hostPatchProp(el,key,null,val)
        }

        hostInsert(el,container)
    }

    function mountChildren(children,container,parentComponent){
        children.forEach((v)=>{
            patch(null,v,container,parentComponent)
        })
    }

    function processComponent(n1,n2,container:any,parentComponent){
        mountComponent(n2,container,parentComponent)// 挂载组件
    }

    function mountComponent(instanceVNode,container:any,parentComponent){
        const instance=createComponentInstance(instanceVNode,parentComponent)// 抽离组件对象 并 创建组件实例 
        setupComponent(instance)
        setupRenderEffect(instanceVNode,instance,container)
    }

    function setupRenderEffect(instanceVNode,instance,container:any){
        // 实现 响应式数据 依赖收集
        effect(()=>{
            // 判断 是 init 还是 update
            if(!instance.isMounted){
                console.log('init');
                
                const {proxy}=instance
                // 调用render()返回vnode -> patch()
                const subTree=( instance.subTree=instance.render.call(proxy) )
                patch(null,subTree,container,instance)
                // element -> mount
                instanceVNode.el=subTree.el
                instance.isMounted=true
            }else{
                console.log('update');
                
                const {proxy}=instance
                // 调用render()返回vnode -> patch()
                const subTree=instance.render.call(proxy)// new component instance
                const prevSubTree=instance.subTree// old component instance
                instance.subTree=subTree
                
                patch(prevSubTree,subTree,container,instance)
            }
        })
    }
    return {
        createApp:createAppApi(render)
    }
}