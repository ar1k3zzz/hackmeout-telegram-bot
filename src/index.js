const TelegramBot = require('node-telegram-bot-api')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const mysql = require("mysql2")
const config = require('./config')
const keyboard = require('./keyboard')
const kb = require('./keyboard-buttons')

console.log("Bot has been started")

var current_page = 'start', current_message = 'none', telegramid = ''

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


bot.on('message', msg => {

	const text = msg.text;
	const chatId = msg.chat.id;

	if(text === '/start'){
		current_page = 'start'
		current_message = 'none'
		telegramid = msg.from.id

		const text = `Доброго времени суток! 👋\nДля начала пожалуйста нажмите кнопку "Поделиться 📱"`

		var option = {
	        parse_mode: 'Markdown',
	        reply_markup: {
	            one_time_keyboard: true,
	            keyboard: [[{
	                text: "Поделиться 📱",
	                request_contact: true
	            }]],
	            resize_keyboard: true
	        }
    	};

		bot.sendMessage(msg.chat.id, text, option).then(()=>{
				bot.on("contact", (msg)=>{
					const text = "Здравствуйте, *${msg.from.first_name}*.\nЯ Вам помогу:\n1. Связаться с Техноконсультантом\n2. Проверить доступный баланс TechnoBonus."
					bot.sendMessage(msg.chat.id, text,{
						reply_markup: {
							keyboard: [
								[
								kb.mainMenu.o1,
								kb.mainMenu.o2
								]
							]
						}
					}, parse_mode = 'Markdown')
				})
			})
	} else if(text === ''){
		current_page = 'mainMenu'
		bot.sendMessage(chatId, `Вы выбрали "Русский язык 🇷🇺"`, {
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
	} else {
		let text
		switch (current_page) {
			case 'start':
				text = `Здравствуйте, *${msg.from.first_name}*.\nДля того чтобы начать общение с ботом напишите команду /start или нажмите на нее.`
				break
			case 'mainMenu':
				text = `Возможно вы ошиблись с запросом. Если требуется помощь напишите на /help.`
				break
			default :
				text = `Возможно вы ошиблись с запросом. Если требуется помощь напишите на /help.`
				break
		}
		bot.sendMessage(chatId, text, parse_mode = 'Markdown')
	}
})

bot.on("polling_error", (err) => console.log(err))
