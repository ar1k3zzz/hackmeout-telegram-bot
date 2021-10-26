const TelegramBot = require('node-telegram-bot-api')
const PDFDocument = require('pdfkit')
const fs = require('fs')
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
		  database: "okukz",
		  password: "root"
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

					let text = `Здравствуйте, *${msg.contact.first_name}*.\n\nЯ Вам помогу:\n\n1. Связаться с Техноконсультантом\n\n2. Проверить доступный баланс TechnoBonus.`
					var option = {
						"parse_mode": 'Markdown',
						"reply_markup": {
							one_time_keyboard: true,
							keyboard: keyboard.mainMenu,
						},
						"resize_keyboard": true
					};
					bot.sendMessage(msg.chat.id, text, option)
				})
			})
	}
	if(text === '/menu'){
		current_page = 'mainMenu'
		await bot.sendMessage(chatId, `Вы выбрали "Русский язык 🇷🇺"`, {
			reply_markup: JSON.stringify({
		        hide_keyboard: true
		    })
		})
			.then(() => {
				connectMySqlDB()

				var sql_select =  "SELECT * FROM `users` WHERE `telegramid` = '"+ telegramid +"'"

				connection.query(sql_select, function(err, results) {
				    if(err) console.log(err)
					if(results.length == 1){
						bot.sendMessage(chatId, 'Вы уже зарегистрированы.')
							.then(() => {
								bot.sendMessage(chatId, 'Хотите изменить личные данные?',{
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: 'Да ✏',
													callback_data: 'change_my_data'
												},
												{
													text: 'Нет, продолжить ➡',
													callback_data: 'continue_authorized'
												}
											]
										]
									}
								})
							})
					} else if(results.length == 0){
						current_page = 'registration'
						reg_section = reg_section_arr[reg_counter]
					    bot.sendMessage(chatId, 'Заполните форму регистрации')
					    	.then(() => {
					    		userRegistrationForm(chatId)
					    	})
					}
				})

				closeMySqlDB()
			})
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
