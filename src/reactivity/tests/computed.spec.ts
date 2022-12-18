import { computed } from "../computed"
import { reactive } from "../reactive"

describe('computed',()=>{
    it('happy path',()=>{
        // computed 缓存
        const user=reactive({
            age:1
        })
        const age=computed(()=>{
            return user.age
        })
        expect(age.value).toBe(1)
    })
    it('should computed lazily(懒执行)',()=>{
        const value=reactive({
            foo:1
        })
        const getter=jest.fn(()=>{
            return value.foo
        })
        const cValue=computed(getter)

        // lazy 懒执行
        expect(getter).not.toHaveBeenCalled()
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(1)

        // // // should not computed again(再一次)
        cValue.value
        expect(getter).toHaveBeenCalledTimes(1)

        // // // should not computed until needed(必须)
        value.foo=2// 触发 trigger() -> but no effect()
        expect(getter).toHaveBeenCalledTimes(1)

        // // // now it should compued
        expect(cValue.value).toBe(2)// scheduler
        expect(getter).toHaveBeenCalledTimes(2)

        // // // should not computed again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(2)
    })
})
