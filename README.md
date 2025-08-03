# Supedo - Bot Discord

Bot Discord simple pour la gestion des tickets et des rôles avec système d'approbation.

## Fonctionnalités

**Système de Tickets**
- Création de tickets avec catégories personnalisées
- Panels configurables avec boutons colorés
- Renommage et fermeture de tickets
- Intégration avec les catégories Discord

**Gestion des Rôles**
- Demandes de rôles avec approbation
- Groupes de rôles organisés
- Recherche de rôles par nom
- Interface d'administration pour les modérateurs

## Installation

### Prérequis
- Node.js 18+
- MySQL 8+
- Bot Discord créé sur le portail développeur
- **Application Discord** avec token bot
- **Serveur Discord** avec permissions appropriées

### ⚙️ Configuration Étape par Étape

#### 1. 📥 **Cloner le Projet**
```bash
git clone https://github.com/imutig/Supedo.git
cd Supedo
```

#### 2. 📦 **Installer les Dépendances**
```bash
npm install
```

#### 3. 🗄️ **Configuration Base de Données**
```sql
CREATE DATABASE supedo_bot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'supedo_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON supedo_bot.* TO 'supedo_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 4. 🔧 **Variables d'Environnement**
### Configuration

1. Cloner le projet
```bash
git clone https://github.com/imutig/Supedo.git
cd Supedo
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer la base de données MySQL
```sql
CREATE DATABASE supedo_bot;
CREATE USER 'supedo_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON supedo_bot.* TO 'supedo_user'@'localhost';
```

4. Créer le fichier `.env`
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_guild_id

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=supedo_user
DB_PASSWORD=your_password
DB_DATABASE=supedo_bot

NODE_ENV=production
```

5. Compiler et démarrer
```bash
npm run build
npm run deploy
npm start
```

## Utilisation

### Commandes

- `/ticket` - Gestion des tickets
- `/role` - Gestion des rôles
- `/info` - Informations du bot
3. Remplissez le formulaire :
### Configuration des Tickets

1. Utiliser `/ticket` pour accéder au menu
2. Créer des catégories avec clé, nom et style de bouton
3. Créer un panel dans un salon
4. Les utilisateurs peuvent cliquer sur les boutons pour créer des tickets

### Configuration des Rôles

1. Utiliser `/role` pour le menu de gestion
2. Les utilisateurs demandent des rôles
3. Les modérateurs approuvent/refusent via boutons
4. Système de groupes de rôles disponible

## Structure

```
src/
├── commands/          # Commandes slash
├── events/            # Gestionnaires d'événements
├── utils/             # Utilitaires et handlers
│   ├── entities/      # Entités TypeORM
│   ├── buttonHandler.ts
│   ├── roleMenuHandler.ts
│   ├── ticketMenuHandler.ts
│   └── database.ts
└── scripts/           # Scripts de maintenance
```

## Base de données

Tables principales:
- `ticket_categories` - Catégories de tickets
- `ticket_panels` - Panels de tickets  
- `tickets` - Tickets individuels
- `role_requests` - Demandes de rôles
- `role_groups` - Groupes de rôles

## Scripts

```bash
npm run dev          # Développement
npm run build        # Compilation  
npm run deploy       # Déployer les commandes
npm run cleanup-db   # Nettoyer la base de données
```

# Compilation TypeScript
npm run build

# Déploiement des commandes
npm run deploy

# Production
npm start

# Nettoyage de la base de données
npm run cleanup-db

# Configuration des catégories par défaut
npm run setup-categories GUILD_ID [CATEGORY_ID]
```

---

## 📁 Architecture du Projet

```
src/
├── commands/           # Commandes slash Discord
│   ├── role.ts        # Gestion des rôles
│   └── ticket.ts      # Gestion des tickets
├── events/            # Gestionnaires d'événements
│   ├── ready.ts       # Événement de démarrage
│   └── interactionCreate.ts  # Interactions Discord
├── utils/             # Utilitaires et logique métier
│   ├── entities/      # Entités TypeORM
│   ├── buttonHandler.ts     # Gestion des boutons
│   ├── roleMenuHandler.ts   # Logique des rôles
│   ├── ticketMenuHandler.ts # Logique des tickets
│   ├── database.ts    # Opérations base de données
│   └── dataSource.ts  # Configuration TypeORM
├── scripts/           # Scripts utilitaires
└── index.ts          # Point d'entrée principal
```

---

## 🐛 Dépannage

### **Problèmes Courants**

#### Bot ne répond pas
```bash
# Vérifier les logs
npm start

# Vérifier les permissions
# Le bot doit avoir les permissions dans le serveur
```

#### Erreurs de base de données
```sql
-- Vérifier la connexion
SHOW PROCESSLIST;

-- Recréer les tables si nécessaire
DROP DATABASE supedo_bot;
CREATE DATABASE supedo_bot CHARACTER SET utf8mb4;
```

#### Commandes non déployées
```bash
# Redéployer les commandes
npm run deploy

# Vérifier la variable GUILD_ID pour le développement
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. 🍴 Fork le projet
2. 🌟 Créez votre branche (`git checkout -b feature/NouvelleFeature`)
3. 💾 Commit vos changements (`git commit -m 'Ajout: Nouvelle fonctionnalité'`)
4. 📤 Push vers la branche (`git push origin feature/NouvelleFeature`)
5. 🔀 Ouvrez une Pull Request

---

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Auteurs

- **imutig** - *Développement* - [GitHub](https://github.com/imutig)

---

## 🙏 Remerciements

- Discord.js pour l'excellente librairie
- TypeORM pour la gestion de base de données

---

<div align="center">

[🐛 Signaler un Bug](https://github.com/imutig/Supedo/issues) • [💡 Demander une Fonctionnalité](https://github.com/imutig/Supedo/issues) • [📖 Documentation](https://github.com/imutig/Supedo/wiki)

</div>
