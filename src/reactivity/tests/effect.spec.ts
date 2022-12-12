import { effect,stop } from "../effect"
import { reactive } from "../reactive"

describe('effect',()=>{
    it('happy path',()=>{
        const user=reactive({
            age:10
        })

        let nextAge
        effect(()=>{
            nextAge=user.age+1
        })
        expect(nextAge).toBe(11)

        user.age++
        expect(nextAge).toBe(12)
    })
    it('should return runner when call effect',()=>{
        //  调用      返回       等于       返回值
        // effect(fn) -> runner === fn -> return
        let foo=10
        const runner=effect(()=>{
            foo++
            return 'foo'
        })
        expect(foo).toBe(11)
        const r=runner();// runner() === run() => 执行 return this._fn()
        expect(foo).toBe(12)
        expect(r).toBe('foo')
    })
    it('scheduler',()=>{
        // 1.通过effect的第二个参数给定的 一个scheduler的fn
        // 2.effect第一次执行的时候 会执行fn
        // 3.当 响应式对象 set update 不会执行 fn 而是执行 scheduler
        // 4.当执行runner的时候，会再次执行 fn
        let dummy
        let run
        // jest.fn() 返回一个新的未使用的 模拟函数
        let scheduler=jest.fn(()=>{
            run=runner
        })
        let obj=reactive({foo:1})
        let runner=effect(()=>{
            dummy=obj.foo
        },{ scheduler })

        // toHaveBeenCalled() 确保 使用 特定的参数 调用 模拟函数
        expect(scheduler).not.toHaveBeenCalled()
        expect(dummy).toBe(1)

        obj.foo++
        // toHaveBeenCalledTimes() 确保 模拟函数 被 调用了精确的次数
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)
        // console.log(obj.foo);// 2
        
        run()
        expect(dummy).toBe(2)
    })
    it('stop', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
          dummy = obj.prop
        })
        obj.prop = 2
        expect(dummy).toBe(2)
        
        stop(runner)
        obj.prop = 3
        expect(dummy).toBe(2)
    
        runner()
        expect(dummy).toBe(3)
    })
    it('onStop', () => {
        const onStop = jest.fn()
        const runner = effect(() => {
            
        }, {
          onStop
        })
    
        stop(runner)
        expect(onStop).toHaveBeenCalledTimes(1)
    })
})