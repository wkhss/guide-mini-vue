import { NodeTypes } from "./ast"

const enum TagType{
    Start,
    End
}

export function baseParse(content:string){
    const context=createParseContext(content)
    return createRoot(parseChildren(context,[]))
}

function createRoot(children){
    return {
        children
    }
}

function parseChildren(context:any,ancestors:any){
    const nodes:any=[]

    while(!isEnd(context,ancestors)){
        let node
        const s=context.source
        if(s.startsWith('{{')){
            node=parseInterpolation(context)
        }else if(s[0]==='<'){
            if(/[a-z]/i.test(s[1])){
                node=parseElement(context,ancestors)
            }
        }
        
        if(!node){
            node=parseText(context)
        }

        nodes.push(node)
    }

    return nodes
}

function isEnd(context,ancestors){
    const s=context.source
    if(s.startsWith('</')){
        for(let i=ancestors.length-1;i>=0;i--){
            const tag=ancestors[i].tag
            if(startsWithEndTagOpen(s,tag)){
                return true
            }
        }
    }
    // if(ancestors && s.startsWith(`</${ancestors}>`)){
    //     return true
    // }

    return !s
}

function parseText(context: any): any {
    let endIndex=context.source.length
    let endToken=['<', '{{' ]
    for (let i = 0; i < endToken.length; i++) {
        const index=context.source.indexOf(endToken[i])
        if(index !== -1 && endIndex > index){
            endIndex=index
        }
    }
    // 1.获取 text
    const content=parseTextData(context,endIndex)
    
    return {
        type:NodeTypes.TEXT,
        content
    }
}

function parseTextData(context:any,length:number){
    const content=context.source.slice(0,length)
    // 2.推进
    advanceBy(context,length)

    return content
}

function parseElement(context:any,ancestors){
    // 1.解析 tag
    const element:any=parseTag(context,TagType.Start)
    ancestors.push(element)
    element.children=parseChildren(context,ancestors)
    ancestors.pop()
    if(startsWithEndTagOpen(context.source,element.tag)){
        parseTag(context,TagType.End)
    }else{
        throw new Error(`缺少结束标签:${element.tag}`);
        
    }
    return element
}

function startsWithEndTagOpen(source,tag){
   return source.slice(2,2+tag.length)===tag
}

function parseTag(context:any,type:TagType){
    const match:any=/^<\/?([a-z]*)/.exec(context.source)
    const tag=match[1]
    
    // 2.删除解析后的代码
    advanceBy(context,match[0].length)
    advanceBy(context,1)

    if(type===TagType.End)return
    
    return {
        type:NodeTypes.ELEMENT,
        tag,
    }
}

function parseInterpolation(context:any){

    const openDelimiter='{{'
    const closeDelimiter='}}'

    const closeIndex=context.source.indexOf(closeDelimiter,openDelimiter.length)

    advanceBy(context,openDelimiter.length)

    const rawContentLength=closeIndex-openDelimiter.length

    // const content=context.source.slice(0,rawContentLength)
    const content=parseTextData(context,rawContentLength)
    
    advanceBy(context,closeDelimiter.length)

    return {
        type:NodeTypes.INTERPOLATION,
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content,
        }
    }
}

function advanceBy(context:any,length:number){
    context.source=context.source.slice(length)
}

function createParseContext(content:string):any{
    return {
        source:content
    }
}

