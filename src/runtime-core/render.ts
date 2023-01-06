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
        patch(null,vnode,rootContainer,null,null)
    }

    // n1 old n2 new
    function patch(n1,n2,container:any,parentComponent,anthro){// patch() 用于递归处理component
        // 判断 是component 还是 element
        // vnode.type -> object || string
        // console.log(vnode.type);
        const { type, shapeFlags } = n2
        switch(type){
            case Fragment:
                processFragment(n1,n2,container,parentComponent,anthro)
            break;
            case Text:
                processText(n1,n2,container)
            break;
            default:
                if(ShapeFlags.ELEMENT & shapeFlags){
                    processElement(n1,n2,container,parentComponent,anthro)
                }else if(ShapeFlags.STATEFUL_COMPONENT & shapeFlags){
                    processComponent(n1,n2,container,parentComponent,anthro)
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

    function processFragment(n1,n2,container:any,parentComponent,anthro){
        mountChildren(n2.children,container,parentComponent,anthro)
    }

    function processElement(n1,n2,container:any,parentComponent,anthro){
        if(!n1){// n1 不存在 就是 初始化
            mountElement(n2,container,parentComponent,anthro)
        }else{
            patchElement(n1,n2,container,parentComponent,anthro)
        }
    }

    function patchElement(n1,n2,container,parentComponent,anthro){
        console.log('patchElement');
        console.log('n1',n1);
        console.log('n2',n2);

        const oldProps=n1.props || EMPTY_OBJECT
        const newProps=n2.props || EMPTY_OBJECT

        const el= ( n2.el = n1.el ) 
        
        patchChildren(n1,n2,el,parentComponent,anthro)
        patchProps(el,oldProps,newProps)
    }
    
    function patchChildren(n1,n2,container,parentComponent,anthro){
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
            if(prevShapeFlags & ShapeFlags.TEXT_CHILDREN){// old is text
                hostSetElementText(container,'')
                mountChildren(c2,container,parentComponent,anthro)
            }else{// old is array
                patchKeyedChildren(c1,c2,container,parentComponent,anthro)
            }
        }
    }
    
    function patchKeyedChildren(c1,c2,container,parentComponent,processAnthro){
        const l2=c2.length
        let e1=c1.length-1
        let i=0
        let e2=l2-1

        function isSomeVNodeType(n1,n2){
            return n1.key === n2.key && n1.type === n2.type
        }

        // 1.右侧对比
        while(i<=e1&&i<=e2){
            const n1=c1[i]
            const n2=c2[i]
            if(isSomeVNodeType(n1,n2)){
                patch(n1,n2,container,parentComponent,processAnthro)
            }else{
                break
            }
            i++
        }

        // 2.左侧对比
        while(i<=e1&&i<=e2){
            const n1=c1[e1]
            const n2=c2[e2]
            if(isSomeVNodeType(n1,n2)){
                patch(n1,n2,container,parentComponent,processAnthro)
            }else{
                break
            }
            e1--
            e2--
        }

        // 3.新的 比 老的 长
        if(i>e1){
            if(i<=e2){
                const nextPos=e2+1
                const anthro=nextPos<l2?c2[nextPos].el:null
                while(i<=e2){
                    patch(null,c2[i],container,parentComponent,anthro)
                    i++
                }
            }
        }else if(i>e2){// 4.老的 比 新的 长
            while(i<=e1){
                hostRemove(c1[i].el)
                i++
            }
        }else{// 5.对比 中间部分
            let s1=i
            let s2=i

            const toBePatched=e2-s2+1
            let patched=0

            let moved=false
            let maxNewIndexSoFar=0
            const KeyToNewIndexMap=new Map()
            const newIndexToOldIndexMap=new Array(toBePatched)
            for(let i=0;i<toBePatched;i++)newIndexToOldIndexMap[i]=0

            for(let i=s2;i<=e2;i++){
                const nextChild=c2[i].key
                KeyToNewIndexMap.set(nextChild,i)
            }

            for(let i=s1;i<=e1;i++){
                const prevChild=c1[i]

                // 5.1.1优化删除逻辑
                if(patched>=toBePatched){
                    hostRemove(prevChild.el)
                    continue
                }

                let newIndex
                if(prevChild.key!==null){
                    newIndex=KeyToNewIndexMap.get(prevChild.key)
                }else{
                    for(let j=s2;j<e2;j++){
                        if(isSomeVNodeType(prevChild,c2[j])){
                            newIndex=j
                            break
                        }
                    }
                }

                if(newIndex===undefined){
                    hostRemove(prevChild.el)// 5.1删除老的
                }else{
                    if(newIndex>=maxNewIndexSoFar){
                        maxNewIndexSoFar=newIndex
                    }else{
                        moved=true
                    }

                    newIndexToOldIndexMap[newIndex-s2]=i+1

                    patch(prevChild,c2[newIndex],container,parentComponent,null)
                    patched++
                }
            }

            const increasingNewIndexSequence=moved?getSequence(newIndexToOldIndexMap):[]
            let j=increasingNewIndexSequence.length-1

            for(let i=toBePatched-1;i>=0;i--){
                const nextIndex=s2+i
                const nextChild=c2[nextIndex]
                const anthro=nextIndex+1<l2?c2[nextIndex+1].el:null
                // 5.3创建新节点
                if(newIndexToOldIndexMap[i]===0){
                    patch(null,nextChild,container,parentComponent,anthro)
                }else if(moved){
                    // 5.2.1移动
                    if(j<0||i!==increasingNewIndexSequence[j]){
                        hostInsert(nextChild.el,container,anthro)
                    }else{
                        j--
                    }
                }
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

    function mountElement(vnode,container:any,parentComponent,anthro){
        // vnode -> element -> div
        // const el=(vnode.el=document.createElement(vnode.type))
        const el=(vnode.el=hostCreateElement(vnode.type))

        // children -> string || array
        const {children,shapeFlags}=vnode
        if(ShapeFlags.TEXT_CHILDREN & shapeFlags){
            el.textContent=children
        }else if(ShapeFlags.ARRAY_CHILDREN & shapeFlags){
            mountChildren(vnode.children,el,parentComponent,anthro)
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

        hostInsert(el,container,anthro)
    }

    function mountChildren(children,container,parentComponent,anthro){
        children.forEach((v)=>{
            patch(null,v,container,parentComponent,anthro)
        })
    }

    function processComponent(n1,n2,container:any,parentComponent,anthro){
        mountComponent(n2,container,parentComponent,anthro)// 挂载组件
    }

    function mountComponent(instanceVNode,container:any,parentComponent,anthro){
        const instance=createComponentInstance(instanceVNode,parentComponent)// 抽离组件对象 并 创建组件实例 
        setupComponent(instance)
        setupRenderEffect(instanceVNode,instance,container,anthro)
    }

    function setupRenderEffect(instanceVNode,instance,container:any,anthro){
        // 实现 响应式数据 依赖收集
        effect(()=>{
            // 判断 是 init 还是 update
            if(!instance.isMounted){
                console.log('init');
                
                const {proxy}=instance
                // 调用render()返回vnode -> patch()
                const subTree=( instance.subTree=instance.render.call(proxy) )
                patch(null,subTree,container,instance,anthro)
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
                
                patch(prevSubTree,subTree,container,instance,anthro)
            }
        })
    }
    return {
        createApp:createAppApi(render)
    }
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }