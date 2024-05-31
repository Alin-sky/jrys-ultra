# koishi-plugin-jrys-ultra

[![npm](https://img.shields.io/npm/v/koishi-plugin-jrys-ultra?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-jrys-ultra)

## 运势文案和算法借(chao)鉴(xi)了[jryspro](https://github.com/Twiyin0/koishi-plugin-jryspro/tree/main),感谢大佬
---
### 获取背景图方式介绍
- #### 回复获取
  - 指令调用者在160秒内发送“原图”获取
  - 🔵优点：不占用本地存储
  - 🟠缺点：可能会占用一部分内存，并且超时和非指令调用者都无法获取
- #### 强获取
  - 通过使用指令"原图"，传入背景图原图或图片hash值获取
  - 系统会自动删除本地文件夹内三天前的数据（beta）
  - 🔵优点：任何人均可获取，且不限制时间
  - 🟠缺点：手机端发送图文较为麻烦，并且背景图会占用本地存储（data/jrys_img）

---
## 更新日志

### 0.2.5
- 增加了md消息模板
- 增加了强原图获取方案（beta）
- 尝试优化运势
- 尝试优化内存

### 0.2.1
- 加了头像
- 增加了选择渲染模式
- 新增获取原图
- 优化了文字框的模糊效果
- 横图的文字框随机左右
- 叽里咕噜

### 0.1.2
- 自定义输出、优化输出
