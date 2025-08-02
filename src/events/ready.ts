import { Events, ActivityType } from 'discord.js';

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: any) {
    console.log(`🤖 [READY] Bot connecté en tant que ${client.user.tag}`);
    console.log(`📊 [READY] ID du bot: ${client.user.id}`);
    console.log(`🏰 [READY] Connecté à ${client.guilds.cache.size} serveur(s)`);
    
    // Log each server the bot is connected to
    client.guilds.cache.forEach((guild: any) => {
      console.log(`  📍 [READY] Serveur: ${guild.name} (${guild.id}) - ${guild.memberCount} membres`);
    });
    
    // Set bot status to "Watching le 911"
    console.log(`🎯 [READY] Configuration du statut du bot...`);
    client.user.setActivity('le 911', { type: ActivityType.Watching });
    console.log(`✅ [READY] Statut du bot défini sur "Regarde le 911"`);
    
    console.log(`🎉 [READY] Bot Supedo prêt à fonctionner !`);
    console.log(`⚡ [READY] Toutes les fonctionnalités sont opérationnelles`);
  },
};
