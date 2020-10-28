const Discord = require("discord.js");
const { token, prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const client = new Discord.Client();
const guild = new Discord.Guild();
const { Client, Util} = require('discord.js')

const queue = new Map()

client.on("ready", () => {   
  console.log("Connected!");

  const guild = client.guilds.cache.get('565506372742152193')
  const GuildMember = guild.memberCount;
  client.user.setPresence({ activity: { type: 'WATCHING' , name: `${GuildMember} Members` }, status: 'online' })
  .then(console.log)
  .catch(console.error);

});




client.on("message", async message => {

          
               
          
             
          
                     
          if(message.author.bot) return
          if (message.channel.id === '770724969483075585')
          {
         
            
  
             //message.channel.bulkDelete(1)
            //.then(messages => console.log(`Bulk deleted ${messages.size} messages`))
           // .catch(console.error);

           const args = message.content;
           const serverQueue = queue.get(message.guild.id)

          
            if (!message.content.startsWith(`${prefix}`))
            {
              message.delete({timeout : 2000})
              
              const voiceChannel = message.member.voice.channel
              if(!voiceChannel)
              return message.channel.send("You Need To Be In A Voice Channel To Play Music").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              const permission = voiceChannel.permissionsFor(message.client.user)
              if(!permission.has('CONNECT'))
              return message.channel.send("I Don't Have Permission To Connect To That Channel").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(!permission.has('SPEAK'))
              return message.channel.send("I Dont Have Permission To Speak In The Channel.").then(sentMessage => sentMessage.delete({ timeout: 2000 }))

              const songInfo = await ytdl.getInfo(args)
              const song = {
                title: Util.escapeMarkdown(songInfo.videoDetails.video_url),
                url: songInfo.videoDetails.video_url
              
              
              }

              if(!serverQueue) {
                const queueConstruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true
                }
                queue.set(message.guild.id, queueConstruct)

                queueConstruct.songs.push(song)

                try{
                  var connection = await voiceChannel.join()
                  queueConstruct.connection = connection
                  play(message.guild, queueConstruct.songs[0])
                } catch(error){
                  console.log(`There Was An Error Connecting To The Voice Channel : ${error}`)
                  queue.delete(message.guild.id)
                  message.channel.send(`There Was An Error Connecting To Te Voice Channel : ${error}`).then(sentMessage => sentMessage.delete({ timeout: 2000 }))
                  return undefined
                }
                
              } else {
                serverQueue.songs.push(song)
                return message.channel.send(`**${song.title}** Has Been Added To The Queue`).then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              }
              return undefined        
            }
            else if (message.content.startsWith(`${prefix}dc`))
            {
              message.delete({timeout: 2000})
              
              if(!message.member.voice.channel) return message.channel.send("You Need To Be In A Voice Channel To Stop Music").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(!serverQueue) return message.channel.send("There Is Nothing Playing ").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              serverQueue.songs = []
              serverQueue.connection.dispatcer.end()
              message.channel.send("I Stopped The Music For You").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              return undefined
            }
            else if (message.content.startsWith(`${prefix}skip`))
            {

              message.delete({timeout: 2000})

              if(!message.member.voice.channel) return message.channel.send("You Need To Be In A Voice Channel To Skip Music").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(!serverQueue) return message.channel.send("There Is Nothing Playing ").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              serverQueue.connection.dispatcer.end()
              message.channel.send("I Skipped The Music For You").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              return undefined
            } else if (message.content.startsWith(`${prefix}volume`)){
              
              message.delete({timeout: 2000})


              if(!message.member.voice.channel) return message.channel.send("You Need To Be In A Voice Channel To Change Music Volume").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(!serverQueue) return message.channel.send("There Is Nothing Playing ").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(!args[1]) return message.channel.send(`That Volume Is: **${serverQueue.volume}**`).then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              if(isNaN(args[1])) return message.channel.send("Please Enter A Valid Amount To Change The Volume").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              serverQueue.volume = args[1]
              serverQueue.connection.dispatcer.setVolumeLogarithmic(args[1] / 5)
               message.channel.send(`I Changed The Volume To: **${args[1]}**`).then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              return undefined
            } else if (message.content.startsWith(`${prefix}np`)) {
              
              message.delete({timeout: 2000})


              if(!serverQueue) return message.channel.send("There Is Nothing Playing ").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              message.channel.send(`Now Playing: **${serverQueue.songs[0].title}**`).then(sentMessage => sentMessage.delete({ timeout: 5000 }))
              return undefined      
            } else if (message.content.startsWith(`${prefix}queue`)) {
              
              message.delete({timeout: 2000})


              if(!serverQueue) return message.channel.send("There Is Nothing Playing ").then(sentMessage => sentMessage.delete({ timeout: 2000 }))
              message.channel.send(`__**Song Queue:**__ \n ${serverQueue.songs.map(song => `**-** <${song.title}>`).join('\n')}\n **Now Playing:** <${serverQueue.songs[0].title}>`, { split: true})
              .then(sentMessage => sentMessage.delete({ timeout: 5000 }))
              return undefined      
            }

            

          }
})


function play(guild, song) {
  const serverQueue = queue.get(guild.id)

  if(!song){
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcer = serverQueue.connection.play(ytdl(song.url))
              .on('finish', () => {
                serverQueue.songs.shift()
                play(guild, serverQueue.songs[0])
              })
              .on('error', error => {
                console.log(error)
              })
              dispatcer.setVolumeLogarithmic(serverQueue.volume / 5)

              
              var PlayinMessage = serverQueue.textChannel.send(`Now Playing: **${song.title}**`).then(sentMessage => sentMessage.delete({ timeout: 5000 }))
              

}


client.login(token);
