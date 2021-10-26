const TelegramBot = require('node-telegram-bot-api')
const mysql = require("mysql2")
const config = require('./config')
const keyboard = require('./keyboard')
const kb = require('./keyboard-buttons')

console.log("Bot has been started")

var current_page = 'start', current_message = 'none', phonenumber = ''

const emoji_num = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','1️⃣0️⃣']

var connection

function connectMySqlDB() {
	connection = mysql.createConnection({
		  host: "localhost",
		  user: "root",
		  password: "root",
		  database: "clientbot"
	})

	connection.connect(function(err){
	    if (err)
	    	return console.error("Ошибка: " + err.message)
	    else
	    	console.log("Подключение к серверу MySQL успешно установлено")
	})
}

function closeMySqlDB() {
	connection.end(function(err) {
		if (err)
			return console.log("Ошибка: " + err.message)
		console.log("Подключение закрыто")
	})
}

const bot = new TelegramBot(config.TOKEN, {polling: true})


bot.setMyCommands([
	{command: '/start', description: 'Начальное приветсвие'},
	{command: '/menu', description: 'Главное меню'}
])

bot.on('message', async msg => {

	console.log(msg.text)

	const text = msg.text;
	const chatId = msg.chat.id;

	if(text === '/start'){
		current_page = 'start'
		current_message = 'none'
		telegramid = msg.from.id

		let text = `Доброго времени суток! 👋\nДля начала пожалуйста нажмите кнопку "Поделиться 📱"`

		var option = {
	        "parse_mode": "Markdown",
	        "reply_markup": {
	            "one_time_keyboard": true,
	            "keyboard": [[{
	                text: "Поделиться 📱",
	                request_contact: true
	            }]],
	            "resize_keyboard": true
	        }
    	};

		await bot.sendMessage(chatId, text, option).then(()=>{
				bot.once("contact", (msg)=>{
					phonenumber = msg.contact.phone_number

					let text = `Здравствуйте, *${msg.contact.first_name}*.\n\nДоступные опций:\n\n1. 🧐 Задать вопрос 🧐\n\n2. 💳 Проверить доступный баланс TechnoBonus 💳`
					var option = {
						"parse_mode": 'Markdown',
						"reply_markup": {
							one_time_keyboard: true,
							keyboard: keyboard.mainMenu,
						},
						"resize_keyboard": true
					};
					bot.sendMessage(chatId, text, option)
				})
			})
	}
	if(text === '/menu'){
		current_page = 'mainMenu'
		let text = `Здравствуйте, *${msg.contact.first_name}*.\n\nДоступные опций:\n\n1. 🧐 Задать вопрос 🧐\n\n2. 💳 Проверить доступный баланс TechnoBonus 💳`
		var option = {
			"parse_mode": 'Markdown',
			"reply_markup": {
				one_time_keyboard: true,
				keyboard: keyboard.mainMenu,
			},
			"resize_keyboard": true
		};
		bot.sendMessage(chatId, text, option)
	}
	if(text === '💳 Проверить доступный баланс TechnoBonus 💳'){
		current_page = 'mainMenu'
		await connectMySqlDB()

		var sql_select =  "SELECT * FROM `users` WHERE `phone_number` = '"+ phonenumber +"'"

		console.log(sql_select)

		await connection.query(sql_select, function(errs, results) {
		    if(errs) console.log(errs)
			if(results.length == 1){
				sql_select =  "SELECT * FROM `bonus` WHERE `phone_number` = '"+ phonenumber +"'"
				connection.query(sql_select, function(err, result) {
					if(err) console.log(err)

					console.log(result)

					if(result.length == 1){
						let date = new Date(result[0].nearest_date)
						console.log(date.getDate())
						let nearest_date = ("0" + date.getDate()).slice(-2) + '.' + ("0" + (date.getMonth()+1)).slice(-2) + '.' + date.getFullYear()
						let text = `Ваш статус: ${result[0].status}\nБлижайшая дата сгорания: ${nearest_date}\nБлижайшая сумма сгорания: ${result[0].nearest_bonus}\nОбщая сумма бонусов: ${result[0].total_bonus}\nДоступная сумма бонусов к оплате: ${result[0].available_bonus}`
						bot.sendMessage(chatId, text,{
							reply_markup: {
								one_time_keyboard: true,
								keyboard: keyboard.mainMenu
							},
							resize_keyboard: true
						})
					} else if(result.length == 0){
						bot.sendMessage(chatId, 'К сожелению у вас нет бонусной карты',{
							reply_markup: {
								one_time_keyboard: true,
								keyboard: keyboard.mainMenu
							},
							resize_keyboard: true
						})
					}
				})
			} else if(results.length == 0){
			    bot.sendMessage(chatId, 'К сожелению вас нет в базе данных',{
					reply_markup: {
						one_time_keyboard: true,
						keyboard: keyboard.mainMenu
					},
					resize_keyboard: true
				})
			}
		})

		await closeMySqlDB()
	}

	if(text !== '/menu' && text !== '/start'){
		return bot.sendMessage(chatId, 'Пожалуйста выберите команду!',{
			reply_markup: {
				one_time_keyboard: true,
				keyboard: keyboard.mainMenu
			},
			resize_keyboard: true
		})
	}
})

bot.on("polling_error", (err) => console.log(err))
