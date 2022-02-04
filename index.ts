import DiscordJS, { Intents, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
import superagent from 'superagent'
dotenv.config()

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', () => {
    console.log("Das Gewitter beginnt.")

    const guildID = '828010797103054899'
    const guild   = client.guilds.cache.get(guildID)
    let commands

    if (guild) {
        commands = guild.commands
    } else {
        commands = client.application?.commands
    }

    commands?.create({
        name: 'weather',
        description: 'Reports the weather at the given location',
        options: [
            {
                name: 'location',
                description: 'Location to check the weather',
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    })
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        return
    }

    const {commandName, options} = interaction

    if (commandName === 'weather') {
        try {
            var data = await getWeather(options.getString('location')!)
        } catch (error) {
            interaction.reply({
                content: `Weather data could not be found for ${options.getString('location')}`,
                ephemeral: true
            })
            return
        }
        let embed = new MessageEmbed()
        .setTitle(`Current weather in ${data.location.name}`)
        .setDescription(data.current.condition.text)
        .addFields(
            {name: 'Temperature', value: `${data.current.temp_c}°C, feels like ${data.current.feelslike_c}°C`},
            {name: 'Wind', value: `${data.current.wind_dir} at ${data.current.wind_kph} km/h`}
        )
        .setImage(`http:${data.current.condition.icon}`)
        .setFooter('Powered by WeatherAPI.com')
        .setURL('https://www.weatherapi.com')

        if (data.current.is_day) {
            embed.setColor("YELLOW")
        }

        interaction.reply({
            embeds: [embed]
        })
    }
})

client.login(process.env.BOT_TOKEN)

async function getWeather(location: String) {
    let weatherdata = JSON.parse((await superagent.get(`http://api.weatherapi.com/v1/current.json?key=${process.env.API_KEY}&q=${location}`)).text)
    return weatherdata
}