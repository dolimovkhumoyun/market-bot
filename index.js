const { Telegraf, Markup, Extra } = require("telegraf");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const order = require("./models/orderModel");
const product = require("./models/productModel");
const category = require("./models/categoryModel");
const CONFIG = require("./config");
const { reply } = require("telegraf/stage");

const image = "https://cdn.pixabay.com/photo/2020/04/14/18/54/market-5043895_960_720.png";

const startMenu = Extra.markdown().markup((m) =>
  m
    .keyboard([
      [m.callbackButton("📘 Продукция"), m.callbackButton("🏢 Магазины")],
      [m.callbackButton("📲 Написать нам"), m.callbackButton("🛒 Корзина")],
      [m.callbackButton("🚚 Доставка")],
    ])
    .resize()
);

const getContact = Extra.markdown().markup((m) =>
  m.keyboard([[m.contactRequestButton("Отправить мой контактный номер")]]).resize()
);
const getLocation = Extra.markdown().markup((m) =>
  m.keyboard([[m.locationRequestButton("Отправить мою геолокацию")]]).resize()
);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.hears("📘 Продукция", async (ctx) => {
  let { data } = await category.getAll();
  let key = _.chunk(data.data, 2);
  const categoryMenu = Markup.inlineKeyboard(
    key.map((label) => [
      Markup.callbackButton(label[0].name, `/cat-${label[0].id}`),
      Markup.callbackButton(label[1].name, `/cat-${label[1].id}`),
    ])
  ).extra();
  return ctx.replyWithPhoto(image, categoryMenu).catch((error) => console.log(error));
});

bot.action(/\/cat\-\w+/g, async (ctx) => {
  try {
    let id = ctx.match.input.split("/cat-")[1];
    let { data } = await product.getProducts(id);
    let key = _.chunk(data.data, 2);
    const productsMenu = Markup.inlineKeyboard(
      key.map((label) => [
        Markup.callbackButton(label[0].name, `product-${label[0].id}-${id}`),
        Markup.callbackButton(label[1].name, `product-${label[1].id}-${id}`),
      ])
    ).extra();

    productsMenu.reply_markup.inline_keyboard.push([Markup.callbackButton("◀️ Назад", `back-to-cat`)]);
    return ctx
      .editMessageMedia({ type: "photo", media: image }, productsMenu)
      .catch((error) => console.log(error));
  } catch (error) {
    console.log(error);
  }
});

bot.action(/product\-\w+/g, async (ctx) => {
  let info = ctx.match.input.split("-");
  let { data } = await product.getProduct(info[1]);
  const extra = Extra.markup(
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          "➖",
          `minus-${data.data[0].name}-${data.data[0].price}-1-${info[1]}-${info[2]}`
        ),
        Markup.callbackButton("1", "quantity"),
        Markup.callbackButton(
          "➕",
          `plus-${data.data[0].name}-${data.data[0].price}-1-${info[1]}-${info[2]}`
        ),
      ],
      [Markup.callbackButton("📥 Добавить в корзину", `watchlist-${info[1]}-1`)],
      [Markup.callbackButton("◀️ Назад", `back-to-prod-${info[2]}`)],
    ])
  );
  extra.caption = `Название: ${data.data[0].name}  \n\nЦена: ${data.data[0].price} сум \n\nКоличество: 1 кг`;
  let media = data.data[0].img;
  return ctx
    .editMessageMedia({ type: "photo", media: data.data[0].img }, extra)
    .catch((error) => console.log(error));
});

bot.action("back-to-cat", async (ctx) => {
  let { data } = await category.getAll();
  let key = _.chunk(data.data, 2);
  const categoryMenu = Markup.inlineKeyboard(
    key.map((label) => [
      Markup.callbackButton(label[0].name, `/cat-${label[0].id}`),
      Markup.callbackButton(label[1].name, `/cat-${label[1].id}`),
    ])
  ).extra();
  return ctx
    .editMessageMedia({ type: "photo", media: image }, categoryMenu)
    .catch((error) => console.log(error));
});

bot.action(/back-to-prod\-\w+/g, async (ctx) => {
  try {
    let info = ctx.match.input.split("-");
    let { data } = await product.getProducts(info[3]);
    let key = _.chunk(data.data, 2);
    const productsMenu = Markup.inlineKeyboard(
      key.map((label) => [
        Markup.callbackButton(label[0].name, `product-${label[0].id}-${info[3]}`),
        Markup.callbackButton(label[1].name, `product-${label[1].id}-${info[3]}`),
      ])
    ).extra();

    productsMenu.reply_markup.inline_keyboard.push([Markup.callbackButton("◀️ Назад", `back-to-cat`)]);
    return ctx
      .editMessageMedia({ type: "photo", media: image }, productsMenu)
      .catch((error) => console.log(error));
  } catch (error) {
    console.log(error);
  }
});

bot.start((ctx) => {
  ctx.reply("Начните делать покупки пройдя в раздел “📘 Продукция”", startMenu);
});

bot.action(/plus-\w+-\w+-\w+-\w+/g, (ctx) => {
  let info = ctx.match[0].split("-");
  const extra = Extra.markup(
    Markup.inlineKeyboard([
      [
        Markup.callbackButton("➖", `minus-${info[1]}-${info[2]}-${++info[3]}-${info[4]}-${info[5]}`),
        Markup.callbackButton(info[3], "quantity"),
        Markup.callbackButton("➕", `plus-${info[1]}-${info[2]}-${info[3]}-${info[4]}-${info[5]}`),
      ],
      [Markup.callbackButton("📥 Добавить в корзину", `watchlist-${info[4]}-${info[3]}`)],
      [Markup.callbackButton("◀️ Назад", `back-to-prod-${info[5]}`)],
    ])
  );
  let caption = `Название: ${info[1]}  \n\nЦена: ${info[2]} сум \n\nКоличество: ${info[3]} кг`;
  return ctx.editMessageCaption(caption, extra).catch((error) => console.log(error));
});

bot.action(/minus-\w+-\w+-\w+-\w+/g, (ctx) => {
  let info = ctx.match[0].split("-");
  if (info[3] == 1) return false;
  const extra = Extra.markup(
    Markup.inlineKeyboard([
      [
        Markup.callbackButton("➖", `minus-${info[1]}-${info[2]}-${--info[3]}-${info[4]}-${info[5]}`),
        Markup.callbackButton(info[3], "quantity"),
        Markup.callbackButton("➕", `plus-${info[1]}-${info[2]}-${info[3]}-${info[4]}-${info[5]}`),
      ],
      [Markup.callbackButton("📥 Добавить в корзину", `watchlist-${info[4]}-${info[3]}`)],
      [Markup.callbackButton("◀️ Назад", `back-to-prod-${info[5]}`)],
    ])
  );
  let caption = `Название: ${info[1]}  \n\nЦена: ${info[2]} сум \n\nКоличество: ${info[3]} кг`;
  return ctx.editMessageCaption(caption, extra).catch((error) => console.log(error));
});

bot.action(/watchlist-\w+-\w+/g, async (ctx) => {
  let info = ctx.match[0].split("-");
  let data = { chat_id: ctx.update.callback_query.from.id, product_id: info[1], amount: info[2] };
  let res = await order.addItem(data);
  if (res.data.statusCode === 200) {
    let { data } = await category.getAll();
    let key = _.chunk(data.data, 2);
    const categoryMenu = Markup.inlineKeyboard(
      key.map((label) => [
        Markup.callbackButton(label[0].name, `/cat-${label[0].id}`),
        Markup.callbackButton(label[1].name, `/cat-${label[1].id}`),
      ])
    ).extra();
    return ctx.replyWithPhoto(image, categoryMenu).catch((error) => console.log(error));
  }
});

bot.action("сancel-order", async (ctx) => {
  try {
    let res = await order.cancelOrder(ctx.from.id);
    if (res.data.statusCode === 200) {
      ctx.answerCbQuery("Ваш заказ успешно отменён");
      return ctx.reply("Ваш заказ успешно отменён");
    }
  } catch (error) {
    console.log(error);
  }
});

const userWizard = new WizardScene(
  "user-wizard",
  (ctx) => {
    ctx.reply("Пожалуйста отправьте нам ваш контакт", getContact);
    // console.log(ctx.message);
    //Necessary for store the input
    ctx.scene.session.user = {};

    //Store the telegram user id
    ctx.scene.session.user.userId = ctx.from.id;
    return ctx.wizard.next();
  },

  async (ctx) => {
    console.log(ctx.message.contact.phone_number);
    if (ctx.message.contact.phone_number) {
      ctx.reply("Send me geolocation", getLocation);
    }
    ctx.scene.session.user.phone_number = ctx.message.contact.phone_number;
    console.log(ctx.scene.session);
    //Store the user in a separate controller
    // userController.StoreUser(ctx.scene.session.user);
    // return ctx.scene.leave(); //<- Leaving a scene will clear the session automatically
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.scene.session.user.phone_number;
    let data = {
      user_id: ctx.from.id,
      phone_number: ctx.scene.session.user.phone_number,
      lat: ctx.message.location.latitude,
      long: ctx.message.location.longitude,
    };
    let res = await order.getWatchlist(ctx.from.id);
    const response = await order.confirmOrder(data);
    if (res.data.statusCode === 200 && res.data !== undefined) {
      let data = res.data;
      let text = `Ваши корзина продуктов:\n\n`;
      data.data.map(
        (item) =>
          (text =
            text +
            `<b>${item.name}</b>\n<b>${item.amount}</b> ${item.unit_name} ✖️ <b>${item.price}</b> = <b>${item.sum} сум</b>\n\n`)
      );
      let sum = 0;
      _.map(data.data, "sum").map((n) => (sum += n));
      text += `<b>Итого:</b> <b>${sum} сум</b>\n\nСтатус: Подтверджён ✅\n\nДооставка осуществится в течении суток`;

      ctx.replyWithHTML(text);
    }
    ctx.reply("Начните делать покупки пройдя в раздел “📘 Продукция”", startMenu);
    return ctx.scene.leave();
  }
);
const stage = new Stage([userWizard]);

bot.use(session());
bot.use(stage.middleware());
bot.action("confirm-order", async (ctx) => {
  ctx.scene.enter("user-wizard");
  // console.log(res);
});
bot.hears("🛒 Корзина", async (ctx) => {
  try {
    const { id } = ctx.update.message.from;
    let res = await order.getWatchlist(id);
    if (res.data.statusCode === 200 && res.data !== undefined) {
      let data = res.data;
      let text = `Ваши корзина продуктов:\n\n`;
      data.data.map(
        (item) =>
          (text =
            text +
            `<b>${item.name}</b>\n<b>${item.amount}</b> ${item.unit_name} ✖️ <b>${item.price}</b> = <b>${item.sum} сум</b>\n\n`)
      );
      let sum = 0;
      _.map(data.data, "sum").map((n) => (sum += n));
      text += `<b>Итого:</b> <b>${sum} сум</b>`;
      const confirmOrder = Markup.inlineKeyboard([
        [Markup.callbackButton("❌ Отменить заказ", `сancel-order`)],
        [Markup.callbackButton("✅ Подтвердить заказ", `confirm-order`)],
      ]).extra();

      ctx.replyWithHTML(text, confirmOrder);
    } else if (res.data.statusCode === 404) {
      ctx.replyWithHTML(`Ваша корзинка пуста.\n <b>Чтобы начать покупку нажмите на "📘 Продукция"</b>`);
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();
