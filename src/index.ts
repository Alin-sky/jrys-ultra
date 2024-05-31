import { Context, Schema, Random, h, Logger } from 'koishi'
import { jrysJson } from './jrys';
import { Image } from '@koishijs/canvas';
import crypto from 'crypto';
import fs, { readdir, stat, unlink } from 'fs';
import path, { join } from 'path';

import { } from "@satorijs/adapter-qq";
import { rootF } from './FMPS_F';
import { pathToFileURL } from 'url';
import { } from "koishi-plugin-cron";

export const inject = { required: ['canvas', 'cron'] }

export const name = 'jrys-ultra'

export interface Config {
  font: string,
  url: string,
  blurs: number,
  color: string,
  draw_modle: "canvas" | "puppeteer"
  background_image: "禁用" | "回复获取" | "强获取"
  hash: boolean
  markdown_setting: {
    table: any
    qqguild: string
  },
}
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    draw_modle: Schema.union([
      Schema.const('canvas').description('canvas'),
      Schema.const('puppeteer').description('puppeteer'),
    ]).description('选择渲染方法').role('radio').required(),
    background_image: Schema.union([
      Schema.const('禁用').description('禁用'),
      Schema.const('回复获取').description('回复获取'),
      Schema.const('强获取').description('强获取'),
    ]).description('背景图获取方法').role('radio').required(),
    hash: Schema.boolean().default(true).description('同时返回图片hash，用于背景图强获取'),
    font: Schema.string().default('YouYuan').description('字体设置(使用系统自带字体，填写系统自带字体的[英文名](https://www.cnblogs.com/chendc/p/9298832.html)，只研究了win系统)'),
    url: Schema.string().required().description('填入url或完整本地文件夹路径'),
    blurs: Schema.number().role('slider').min(0).max(100).step(1).default(50).description('透明度'),
    color: Schema.string().required().role('color').description('模糊框背景色'),
  }).description('基础配置'),
  Schema.object({
    markdown_setting: Schema.object({
      table: Schema.array(Schema.object({
        MD模板id: Schema.string(),
        MD模板参数1: Schema.string(),
        MD模板参数2: Schema.string(),
        MD模板参数3: Schema.string(),
        MD模板参数4: Schema.string(),
      })).role('table'),
      qqguild: Schema.string().description('QQ频道id，可通过inspect获取，应该是纯数字'),
    }).collapse(),
  }).description('QQ官方bot设置,使用QQ频道来发送md图片'),

])

export const usage = `
# koishi-plugin-jrys-ultra
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
  - 🟠缺点：手机端发送图文图片较为麻烦，并且背景图会占用本地存储（data/jrys_img）

---
`

export async function apply(ctx: Context, config: Config) {

  const fonts = config.font
  const blur = config.blurs
  const url = config.url
  const color = config.color
  const log1 = "jrys-ultra"
  const logger: Logger = new Logger(log1)
  const random = new Random(() => Math.random())
  const qqavaurl = 'https://api.qqsuu.cn/api/dm-qt?qq='

  const mdid = config.markdown_setting.table.length == 0 ? null : config.markdown_setting.table[0]['MD模板id']
  const mdkey1 = config.markdown_setting.table.length == 0 ? null : config.markdown_setting.table[0]['MD模板参数1']
  const mdkey2 = config.markdown_setting.table.length == 0 ? null : config.markdown_setting.table[0]['MD模板参数2']
  const mdkey3 = config.markdown_setting.table.length == 0 ? null : config.markdown_setting.table[0]['MD模板参数3']
  const mdkey4 = config.markdown_setting.table.length == 0 ? null : config.markdown_setting.table[0]['MD模板参数4']
  const qqguild_id = config.markdown_setting.qqguild
  const root = await rootF("jrys_img")
  var mdswitch: boolean = false
  if (mdkey2 && mdkey3 && mdkey4 && mdkey1 && mdid && qqguild_id) {
    logger.info('🟢 已启用MD消息模板')
    mdswitch = true
  } else {
    logger.info("⚠️ md相关设置未完善,未启用MD模板")
    mdswitch = false
  }

  function getyunshi_text(num: number) {
    return {
      jrys: jrysJson[num],
      num: num
    }
  }

  function identifyString(str: string): 'URL' | 'Path' | 'Unknown' {
    // 使用正则表达式检查是否为网络链接
    const urlPattern = /^https?:\/\/.+/i;
    if (urlPattern.test(str)) {
      return 'URL';
    }
    // 简单的检查可能是路径的条件（例如，包含扩展名或特定路径分隔符）
    // 注意：这种方法可能不是非常准确，因为路径和URL可能有相似的特征
    const pathPattern = /(\.\w+)$|([\\\/])/;
    if (pathPattern.test(str)) {
      return 'Path';
    }
    // 如果既不匹配URL也不匹配路径，返回未知
    return 'Unknown';
  }

  /**
   * buffer图像储存函数
   * @param buffer 传入的buffer
   * @param dirpath 要保存到的路径
   * @param fname 文件名，带格式
   */
  async function img_save(buffer: Buffer, dirpath: string, fname: string) {
    try {
      // 确保目录存在，如果不存在则创建
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }
      // 构建完整的文件路径
      const filePath = path.join(dirpath, fname);
      // 将buffer写入文件
      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          logger.info("出现错误：" + err)
        } else {
          return filePath
        }
      });
    } catch (e) {
      logger.info("出现错误：" + e)
    }
  }

  function markdown(session, hash, width, height, url) {
    let t2text = ''
    t2text = random.pick([
      '0-10点的为高峰期，爱丽丝可能会回复不过来😿',
      "😽😽😽",
      "😺😺😺",
      ""
    ])

    return {
      msg_type: 2,
      msg_id: session.messageId,
      markdown: {
        custom_template_id: mdid,
        params: [
          {
            key: mdkey1,
            values: ["这是您的今日运势"],
          },
          {
            key: mdkey2,
            values: [' '],
          },
          {
            key: mdkey3,
            values: [`![img#${Math.round(width)}px #${Math.round(height)}px]`],
          },
          {
            key: mdkey4,
            values: [`(${url})`],
          }
        ]
      },
      keyboard: {
        content: {
          rows: [
            {
              buttons: [
                {
                  render_data: { label: "再来一张", style: 1 },
                  action: {
                    type: 2, // 指令按钮
                    permission: { type: 2 },
                    data: `/今日运势`,
                    enter: true,
                  },
                },
                {
                  render_data: { label: "查看背景图", style: 1 },
                  action: {
                    type: 2,
                    permission: { type: 2 },
                    data: `/原图 ${hash}`,
                    enter: true,
                  },
                },
              ]
            },
          ],
        },
      },
    }
  }

  /**
      * 刷新机器人的令牌并上传图片到指定频道,抄的上学的，上学抄的22的（）
      * @param data - 图片数据或者文件路径(buffer)
      * @param appId - 机器人AppID
      * @param secret - 机器人Secret
      * @param channelId - 频道ID
      */
  async function img_to_channel(data: Buffer, appId, secret, channelId) {
    async function refreshToken(bot) {
      const { access_token: accessToken, expires_in: expiresIn } = await ctx.http.post('https://bots.qq.com/app/getAppAccessToken', {
        appId: bot.appId,
        clientSecret: bot.secret
      });
      bot.token = accessToken;
      await ctx.setTimeout(() => refreshToken(bot), (expiresIn - 30) * 1000);
    }
    const bot = { appId, secret, channelId };
    // 刷新令牌
    await refreshToken(bot);
    const payload = new FormData();
    payload.append('msg_id', '0');
    payload.append('file_image', new Blob([data], { type: 'image/png' }), 'image.jpg');
    await ctx.http.post(`https://api.sgroup.qq.com/channels/${bot.channelId}/messages`, payload, {
      headers: {
        Authorization: `QQBot ${bot['token']}`,
        'X-Union-Appid': bot.appId
      }
    });
    // 计算MD5并返回图片URL
    const md5 = crypto.createHash('md5').update(data).digest('hex').toUpperCase();
    return `https://gchat.qpic.cn/qmeetpic/0/0-0-${md5}/0`
  }


  // 定义一个异步函数来遍历文件夹并随机返回一个.jpg或.png文件的路径
  async function getRandomImage(directory: string): Promise<string | undefined> {
    if (identifyString(directory) == "URL") {
      return
    }
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        // 筛选出.jpg和.png文件
        const imageFiles = files.filter(file => {
          return file.endsWith('.jpg') || file.endsWith('.png');
        });
        // 如果没有找到图片文件，返回undefined
        if (imageFiles.length === 0) {
          resolve(undefined);
          return;
        }
        // 随机选择一个图片文件并返回其路径
        const chosenImage = random.pick(imageFiles);
        resolve(path.join(directory, chosenImage));
      });
    });
  }

  function deleteOldFiles(directory: string): void {
    readdir(directory, (err, files) => {
      if (err) throw err;

      files.forEach(file => {
        const filePath = join(directory, file);
        stat(filePath, (err, stats) => {
          if (err) throw err;

          const now = new Date().getTime();
          const endTime = new Date(stats.mtime).getTime() + 3 * 24 * 60 * 60 * 1000; // 文件修改时间 + 3天
          // 如果文件是三天前的，则删除
          if (now > endTime) {
            unlink(filePath, err => {
              if (err) throw err;
              logger.info(`${filePath} was deleted`);
            });
          }
        });
      });
    });
  }

  ctx.cron('0 0 * * *', () => {
    deleteOldFiles(root)
  })
  deleteOldFiles(root)

  let width = 0
  let height = 0
  async function getImageSizeAndLog(imageUrl: string, num: number, color: string, blurs: number, avaurl) {
    try {
      const image = await ctx.canvas.loadImage(imageUrl);
      let wid = config.draw_modle == "canvas" ? 'width' : 'naturalWidth'
      let hei = config.draw_modle == "canvas" ? 'height' : 'naturalHeight'
      width = image[wid]
      height = image[hei]

      //进行横竖判断
      var type: boolean = false
      if (height >= width) {
        type = true
      } else { type = false }
      const type2 = random.bool(0.5)
      //进行尺寸限制
      if (width > 2560 || height > 1440) {
        const x = width / 2560
        const y = height / 1440
        if (x > y) {
          height = height / x; width = width / x
        } else { width = width / y; height = height / y }
      }
      const canvass = await ctx.canvas.createCanvas(width, height)
      const ctximg = canvass.getContext('2d')
      ctximg.drawImage(image, 0, 0, width, height);

      // 在画布的左上角画一个圆角矩形
      var size_type = {
        rw: 1,
        rh: 1,
        rx: 1,
        ry: 1
      }
      if (type) {
        //竖屏
        size_type.rw = (width / 15) * 14;
        size_type.rh = height / 3.8;
        size_type.rx = (width / 30) // 矩形的 x 坐标
        size_type.ry = (height / 8) * 5.8 // 矩形的 y 坐标
      } else {
        if (type2) {
          size_type.rw = width / 4;
          size_type.rh = (height / 10) * 9.5;
          size_type.rx = (width / 50) // 矩形的 x 坐标
          size_type.ry = height / 40 // 矩形的 y 坐标
        } else {
          //右边
          size_type.rw = width / 4;
          size_type.rh = (height / 10) * 9.5;
          size_type.rx = (width / 50) * 37 // 矩形的 x 坐标
          size_type.ry = height / 40 // 矩形的 y 坐标
        }

      }
      const rectWidth = size_type.rw
      const rectHeight = size_type.rh
      const cornerRadius = 50; // 圆角半径
      const rectX = size_type.rx
      const rectY = size_type.ry
      ctximg.save(); // 保存当前的上下文状态
      // 创建圆角矩形路径
      ctximg.beginPath();
      ctximg.moveTo(rectX + cornerRadius, rectY);
      ctximg.lineTo(rectX + rectWidth - cornerRadius, rectY);
      ctximg.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
      ctximg.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
      ctximg.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
      ctximg.lineTo(rectX + cornerRadius, rectY + rectHeight);
      ctximg.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
      ctximg.lineTo(rectX, rectY + cornerRadius);
      ctximg.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
      ctximg.shadowColor = `rgba(0,0,0,${blurs / 100})`;
      ctximg.shadowBlur = 50;
      ctximg.shadowOffsetX = 0;
      ctximg.shadowOffsetY = 0;
      ctximg.fillStyle = color;
      ctximg.closePath();
      ctximg.clip(); // 应用剪辑路径
      ctximg.filter = `blur(${blurs}px)`;
      ctximg.fillStyle = color;
      ctximg.drawImage(image, 0, 0, width, height);
      ctximg.fill();
      ctximg.shadowColor = 'transparent'; // 移除阴影
      ctximg.filter = 'none'; // 移除模糊效果
      ctximg.fill();
      ctximg.restore();
      // 恢复上下文状态，移除剪辑路径
      let text = getyunshi_text(num)
      let lev = text.jrys.fortuneSummary
      let star = text.jrys.luckyStar
      let text1 = text.jrys.signText
      let text2 = text.jrys.unsignText;
      //头像创建函数
      async function create_Avatar_creation(url: string) {
        const a = 10
        const b = 20
        const avatar_hi = width / a
        const avatar_wi = width / a
        const img_data = await ctx.canvas.loadImage(url)
        const canvas = await ctx.canvas.createCanvas(avatar_wi + 20, avatar_hi + 20)
        const ctx_a = canvas.getContext('2d')
        ctx_a.fillStyle = 'rgba(0, 0, 0, 0.0)';
        ctx_a.fillRect(0, 0, avatar_wi, avatar_hi);
        ctx_a.save();
        ctx_a.beginPath();
        ctx_a.arc((width / b) + 2, (width / b) + 2, width / b, 0, Math.PI * 2);
        ctx_a.clip();
        ctx_a.drawImage(img_data, 2, 2, width / a, width / a)
        ctx_a.restore();
        ctx_a.strokeStyle = '#66ccff';
        ctx_a.lineWidth = 4;
        ctx_a.beginPath();
        ctx_a.arc((width / b) + 2, (width / b) + 2, width / b, 0, Math.PI * 2);
        ctx_a.stroke();
        return canvas.toBuffer("image/png")
      }
      async function text_lev(lev: string, star: string, type: boolean) {
        const avadraw = await ctx.canvas.loadImage(await create_Avatar_creation(avaurl))
        if (type) {
          let x = (width / 10) * 5.2
          let y = (height / 6) * 4.55
          ctximg.textAlign = 'left';  //左对齐
          const fontSize = width / 25
          ctximg.font = `bold ${fontSize}px ${fonts}`;
          ctximg.fillStyle = '#000000';
          ctximg.fillText(lev, x, y);
          y += width / 25
          ctximg.fillText(star, x, y);
          ctximg.fillText(`您今日的运势为：`, (width / 5.8), (height / 8) * 6.2);
          ctximg.drawImage(avadraw, (width / 20), (height / 8) * 5.85)
        } else {
          if (type2) {
            let x = width / 7
            let y = (height / 6) * 0.74
            ctximg.textAlign = 'center';  // 水平居中
            const fontSize = width / 45
            ctximg.font = `bold ${fontSize}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            ctximg.fillText(lev, x, y);
            y += width / 35
            ctximg.fillText(star, x, y);
            ctximg.textAlign = 'left';  //左对齐
            ctximg.fillText(`您今日的运势为：`, (width / 13), height / 15);
            ctximg.drawImage(avadraw, (width / 40), height / 30, width / 18, width / 18)
          } else {
            let x = (width / 50) * 43.3
            let y = (height / 6) * 0.74
            ctximg.textAlign = 'center';  // 水平居中
            const fontSize = width / 45
            ctximg.font = `bold ${fontSize}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            ctximg.fillText(lev, x, y);
            y += width / 35
            ctximg.fillText(star, x, y);
            ctximg.textAlign = 'left';  //左对齐
            ctximg.fillText(`您今日的运势为：`, (width / 13) * 10.5, height / 15);
            ctximg.drawImage(avadraw, (width / 40) * 29.8, height / 30, width / 18, width / 18)
          }
        }
      }
      function text_lay(text1: string, text2: string, type: boolean,) {
        if (type) {
          let x = (width / 15) * 2
          let y = (height / 6) * 5.3
          let lineHeight = width / 33  // 行高
          const fontSize = width / 35
          //横
          ctximg.beginPath();
          ctximg.moveTo((width / 15) * 1.25, (height / 6) * 4.85);
          ctximg.lineTo((width / 15) * 13.75, (height / 6) * 4.85);
          ctximg.stroke();
          ctximg.font = `bold ${fontSize * 1.05}px ${fonts}`;
          ctximg.fillStyle = '#000000';
          ctximg.textAlign = 'center';
          ctximg.fillText(text1, width / 2, y * 0.96);
          ctximg.font = `bold ${fontSize}px ${fonts}`;
          ctximg.textAlign = 'left';
          for (let char of text2) {
            ctximg.fillText(char, x, y);
            x += lineHeight;
            if (x > (width / 15) * 13.5) {
              y += lineHeight
              x = (width / 15) * 1.5
            }
          }
          ctximg.font = `bold ${fontSize * 0.5}px ${fonts}`;
          ctximg.fillStyle = '#000000';
          ctximg.textAlign = 'center';
          ctximg.fillText('仅供娱乐|相信科学|请勿迷信', width / 2, height * 0.98)

        } else {
          if (!type2) {
            //这写的是啥，能跑就行
            let x1 = (width / 4.3) * 4.1
            let x2 = (width / 6.35) * 5.7
            let y = height / 4
            let lineHeight = width / 50  // 行高
            const fontSize = width / 55
            ctximg.font = `bold ${fontSize}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            //竖线
            ctximg.beginPath();
            ctximg.moveTo((width / 5) * 4.7, height / 4.2);
            ctximg.lineTo((width / 5) * 4.7, height * 0.85);
            ctximg.stroke();
            for (let char of text2) {
              ctximg.fillText(char, x2, y);
              y += lineHeight;  // 更新 y 坐标，使得下一个字符在下一行绘制
              if (y > (height * 0.95)) {
                x2 -= lineHeight * 1.15
                y = height / 4
              }
            }
            //重置y
            y = height / 4
            for (let char of text1) {
              ctximg.fillText(char, x1, y);
              y += lineHeight;
              if (y > (height * 0.95)) {
                x1 -= lineHeight * 1.15
                y = height / 4
              }
            }
            ctximg.font = `bold ${fontSize * 0.5}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            ctximg.textAlign = 'center';
            ctximg.fillText('仅供娱乐|相信科学|请勿迷信', (width / 7) * 6.1, height * 0.965)

          } else {
            let x1 = width / 4.3
            let x2 = width / 6.35
            let y = height / 4
            let lineHeight = width / 50  // 行高
            const fontSize = width / 55
            ctximg.font = `bold ${fontSize}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            //竖线
            ctximg.beginPath();
            ctximg.moveTo(width / 5, height / 4.2);
            ctximg.lineTo(width / 5, height * 0.85);
            ctximg.stroke();
            for (let char of text2) {
              ctximg.fillText(char, x2, y);
              y += lineHeight;  // 更新 y 坐标，使得下一个字符在下一行绘制
              if (y > (height * 0.95)) {
                x2 -= lineHeight * 1.15
                y = height / 4
              }
            }
            //重置y
            y = height / 4
            for (let char of text1) {
              ctximg.fillText(char, x1, y);
              y += lineHeight;
              if (y > (height * 0.95)) {
                x1 -= lineHeight * 1.15
                y = height / 4
              }
            }
            ctximg.font = `bold ${fontSize * 0.5}px ${fonts}`;
            ctximg.fillStyle = '#000000';
            ctximg.textAlign = 'center';
            ctximg.fillText('仅供娱乐|相信科学|请勿迷信', width / 7, height * 0.965)
          }
        }
      }
      text_lay(text1, text2, type)
      await text_lev(lev, star, type)
      const buffers = canvass.toBuffer("image/png")
      return buffers;
    } catch (error) {
      logger.info('渲染图像时出错：', error);
    }
  }

  function calculateHash(buffer: Buffer): string {
    // 每次调用函数时都创建一个新的哈希对象
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  ctx.command('jrysultra [red] [green] [blue] [alpha] [blurs]', '输出当日运势图片')
    .alias('每日运势')
    .usage('可传入文字框的颜色和透明度(透明度最高100)\n 在两分钟内@机器人并发送‘原图’，即可获取背景图片')
    .example('jrysultra 102 204 255 0.6 40  【rgba的四个值和模糊度】')
    .option('text', '-t 文字输出')
    .action(async ({ options, session }, red, green, blue, alpha, blurs) => {
      let fimg
      await getRandomImage(url)
        .then(imagePath => {
          if (imagePath) {
            fimg = imagePath
          }
        })
        .catch(err => {
          logger.error(err);
        });
      if (options.text) {
        let text = getyunshi_text(getJrys(session))
        try {
          session.send(h.image(url))
        } catch (error) {
          logger.info(error)
        }
        return (`
你的今日运势为：
⚫${text.jrys.fortuneSummary}
⚪${text.jrys.luckyStar}
⚫${text.jrys.signText}
⚪${text.jrys.unsignText}
        `)
      }
      var colors: string = color
      var blurss: number = blur
      function Data_review(red, green, blue, alpha, blurs) {
        red = parseInt(red);
        green = parseInt(green);
        blue = parseInt(blue);
        alpha = parseFloat(alpha);
        blurs = parseInt(blurs);
        if (typeof red == 'number' && red >= 0 && red <= 255 &&
          typeof green == 'number' && green >= 0 && green <= 255 &&
          typeof blue == 'number' && blue >= 0 && blue <= 255) {
          if (typeof alpha === 'number' && alpha >= 0 && alpha <= 1) {
            colors = `rgba(${red},${green},${blue},${alpha})`
            if (typeof blurs === 'number' && blurs >= 0 && blurs <= 100) {
              blurss = blurs
            } else {
              blurss = blur
            }
            return [colors, blurss]
          } else {
            colors = `rgba(${red},${green},${blue},0.5)`
            if (typeof blurs === 'number' && blurs >= 0 && blurs <= 100) {
              blurss = blurs
            } else {
              blurss = blur
            }
            return [colors, blurss]
          }
        } else {
          colors = color
          blurss = blur
          return [colors, blurss]
        }
      }

      function getJrys(session) {
        const md5 = crypto.createHash('md5');
        const hash = crypto.createHash('sha256');
        // 获取当前日期的零点时间戳（毫秒）
        const etime = new Date().setHours(0, 0, 0, 0);
        let userId: any;
        // 如果 session.userId 是数字，则直接使用
        if (!isNaN(Number(session.userId))) {
          userId = session.userId;
        } else {
          // 否则，如果 session.userId 存在，则使用 SHA256 哈希算法计算哈希值，然后取模得到一个数字
          if (session.userId) {
            hash.update(session.userId);
            let hashhexDigest = hash.digest('hex');
            userId = Number(parseInt(hashhexDigest, 16)) % 1000000001;
          }
          // 如果 session.userId 不存在，则使用 MD5 哈希算法计算 session.username 的哈希值，然后取模得到一个数字
          else {
            md5.update(session.username);
            let hexDigest = md5.digest('hex');
            userId = parseInt(hexDigest, 16) % 1000000001;
          }
        }
        // 这个索引是根据当前日期的零点时间戳（秒）和用户 ID 的和乘以一个常数，然后对运势数组的长度加一取模得到的
        var todayJrys = ((etime / 1000 + userId) * 2333) % (jrysJson.length + 1);
        todayJrys = todayJrys % 80;
        // 返回对应索引的运势
        return Number(todayJrys);
      }
      console.log(getJrys(session))
      const art = Data_review(red, green, blue, alpha, blurs)
      let ava_url = ''
      if (session.event.platform == 'qq') {
        ava_url = `https://q.qlogo.cn/qqapp/${session.bot.config.id}/${session.event.user?.id}/640`
      } else {
        try {
          const ids = (session.event.user.id)
          ava_url = qqavaurl + ids
        } catch (e) {
          logger.error(e)
        }
      }
      for (let i = 1; i < 4; i++) {
        try {
          let img
          if (fimg) {
            const data = fs.readFileSync(fimg);
            img = data
          } else {
            img = await ctx.http.get(url)
          }
          const imgBuff = await getImageSizeAndLog(img, getJrys(session), art[0].toString(), Number(art[1]), ava_url);
          if (mdswitch && session.event.platform == 'qq') {
            const hash = calculateHash(imgBuff);
            // 计算哈希值，输出为十六进制字符串
            console.log(hash)
            await img_save(Buffer.from(img), root, hash + '.jpg')
            const url = await img_to_channel(imgBuff, session.bot.config.id, session.bot.config.secret, qqguild_id)
            console.log(url)
            const md_mess = markdown(session, hash, width, height, url)
            try {
              await session.qq.sendMessage(session.channelId, md_mess)
            } catch (e) {
              logger.info(e)
              await session.send(h.image(imgBuff, 'image/jpg'))
            }
            return
          } else {
            await session.send(h.image(imgBuff, 'image/jpg'))
          }
          if (config.background_image == "禁用") {
            return
          } else if (config.background_image == "回复获取") {
            const name = await session.prompt(160000)
            if (!name) return
            if (name == '原图') {
              session.send(h.image(img, 'image/jpg'))
              img = ''
              return
            } else if (name == 'jrys' || name == '今日运势') {
              img = ''
              return session.execute('jrysultra')
            } else {
              img = ''
              return
            }
          } else if (config.background_image == "强获取") {
            const hash = calculateHash(imgBuff);
            console.log(hash)
            await img_save(Buffer.from(img), root, hash + '.jpg')
            if (config.hash) {
              return `背景图片hash为：
${hash}
通过指令：原图+空格+hash
可获取背景图片哦
              `
            } else {
              return
            }

          }
        } catch (e) {
          logger.info(e)
          logger.info('渲染出错，进行第' + i + '次重试')
          if (i == 3) {
            logger.info('尝试' + i + '次后依旧出错')
            return '呜呜呜，图片渲染出错了＞﹏＜'
          }
        }
      }
    });
  ctx.command("原图 <img_hash>")
    .alias("背景图")
    .action(async (_, img_hash) => {
      const imgdata = h.parse(img_hash)
      console.log(imgdata)
      if (imgdata[0].type == "img") {
        const hash = calculateHash(Buffer.from(await ctx.http.get(imgdata[0].attrs.src)))
        try {
          return h.image(pathToFileURL(`${root}/${hash}.jpg`).href)
        } catch (e) {
          logger.info(e)
          return "呜呜，获取原图出错了"
        }
      } else if (imgdata[0].type == "text") {
        try {
          return h.image(pathToFileURL(`${root}/${img_hash}.jpg`).href)
        } catch (e) {
          logger.info(e)
          return "呜呜，获取原图出错了"
        }
      } else {
        return "呜呜，获取原图出错了"
      }
    })
}
