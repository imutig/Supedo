# 🤖 Supedo - Bot Discord ### 🎭 **Gestion Avancée des Rôles**
- 🎯 **Système d'Approbation** - Demandes de rôles avec validation par les modérateurs
- 👥 **Groupes de Rôles** - Organisation en groupes avec permissions spécifiques
- ➕ **Ajout/Retrait** - Système unifié pour ajouter et retirer des rôles
- ⏱️ **Gestion en Attente** - Interface pour gérer toutes les demandes en cours

> **Bot Discord** avec système de tickets personnalisable et gestion avancée des rôles pour GrandLineFA

<div align="center">

![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

</div>

---

## ✨ Fonctionnalités Principales

### � **Système de Tickets Avancé**
- 📋 **Panels Personnalisables** - Créez des panels de tickets avec titre, description et couleurs
- 🏷️ **Catégories Personnalisées** - Définissez vos propres catégories avec boutons colorés
- 🎨 **4 Styles de Boutons** - Primaire (bleu), Secondaire (gris), Succès (vert), Danger (rouge)
- 📁 **Intégration Discord** - Assignation automatique aux catégories Discord
- ✏️ **Renommage de Tickets** - Les utilisateurs peuvent renommer leurs tickets
- 🔒 **Fermeture Sécurisée** - Confirmation avant fermeture
- 📊 **Statistiques Complètes** - Suivi des tickets par catégorie

### � **Gestion Avancée des Rôles**
- 🎯 **Système d'Approbation** - Demandes de rôles avec validation par les modérateurs
- 👥 **Groupes de Rôles** - Organisation en groupes avec permissions spécifiques
- ➕ **Ajout/Retrait** - Système unifié pour ajouter et retirer des rôles
- 📬 **Notifications DM** - Messages privés automatiques pour les demandes
- ⏱️ **Gestion en Attente** - Interface pour gérer toutes les demandes en cours

### 🛠️ **Interface Utilisateur**
- 🖱️ **Boutons Interactifs** - Interface moderne avec boutons Discord
- 📝 **Modals Intuitifs** - Formulaires pour la saisie d'informations
- 🎛️ **Menus Déroulants** - Navigation facile entre les options
- 🔄 **Temps Réel** - Mises à jour instantanées des statuts

---

## 🚀 Installation & Configuration

### 📋 Prérequis
- **Node.js** 18.0.0+ ([Télécharger](https://nodejs.org/))
- **MySQL** 8.0+ ([Télécharger](https://mysql.com/downloads/))
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
Créez un fichier `.env` :
```env
# Discord Configuration
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=id_de_votre_application
GUILD_ID=id_de_votre_serveur (optionnel pour dev)

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=supedo_user
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=supedo_bot

# Environment
NODE_ENV=production
```

#### 5. 🔨 **Build et Déploiement**
```bash
# Compiler le TypeScript
npm run build

# Déployer les commandes slash
npm run deploy

# Démarrer le bot
npm start
```

---

## 📚 Guide d'Utilisation

### 🎫 **Gestion des Tickets**

#### **Commande Principale**
```
/ticket
```
**Menu Principal** avec les options :
- 📋 **Créer un Panel** - Nouveau panel dans un salon
- ⚙️ **Gérer Catégories** - Créer/modifier les catégories
- 🎨 **Personnaliser** - Modifier l'apparence des panels
- 📊 **Statistiques** - Voir les stats des tickets
- 🗑️ **Supprimer Panel** - Retirer un panel existant
- 📝 **Lister Panels** - Voir tous les panels actifs

#### **Création de Catégories**
1. Sélectionnez la catégorie Discord de destination
2. Choisissez le style de bouton (couleur)
3. Remplissez le formulaire :
   - **Clé** : Identifiant unique (ex: `support`, `bug`)
   - **Nom** : Nom affiché (ex: "Support Technique")
   - **Bouton** : Texte du bouton (ex: "Obtenir de l'aide")
   - **Emoji** : Emoji optionnel (ex: 🎫)
   - **Message** : Message automatique à l'ouverture

#### **Actions sur les Tickets**
- ✏️ **Renommer** : Modifier le nom du channel
- 🔒 **Fermer** : Fermer avec confirmation

### 🎭 **Gestion des Rôles**

#### **Commande Principale**
```
/role
```
**Menu de Gestion** avec :
- 🎯 **Demander un Rôle** - Faire une demande d'ajout
- ➖ **Retirer un Rôle** - Faire une demande de retrait
- 👥 **Groupes de Rôles** - Gérer les groupes
- ⏱️ **Demandes en Attente** - Voir les demandes (modérateurs)

#### **Workflow d'Approbation**
1. **Utilisateur** fait une demande via `/role`
2. **Système** envoie une notification aux modérateurs
3. **Modérateur** approuve ou refuse via les boutons
4. **Rôle** est attribué ou refusé automatiquement

---

## 🗄️ Structure de la Base de Données

### **Tables Principales**

#### `ticket_categories` - Catégories de Tickets
- `id` - Identifiant unique
- `guildId` - ID du serveur Discord
- `categoryKey` - Clé unique de la catégorie
- `categoryName` - Nom affiché
- `buttonLabel` - Texte du bouton
- `buttonEmoji` - Emoji du bouton
- `buttonStyle` - Style du bouton (1-4)
- `discordCategoryId` - ID de la catégorie Discord
- `openMessage` - Message d'ouverture automatique

#### `ticket_panels` - Panels de Tickets
- `id` - Identifiant unique
- `guildId` - ID du serveur Discord
- `channelId` - ID du canal Discord
- `messageId` - ID du message panel
- `panelTitle` - Titre du panel
- `panelDescription` - Description du panel
- `panelColor` - Couleur du panel
- `createdBy` - ID du créateur
- `createdAt` - Date de création

#### `role_requests` - Demandes de Rôles
- `id` - Identifiant unique
- `userId` - ID de l'utilisateur
- `roleId` - ID du rôle demandé
- `guildId` - ID du serveur Discord
- `requestType` - Type (`add` | `remove`)
- `status` - Statut (`pending` | `approved` | `denied`)
- `requestedAt` - Date de demande

#### `tickets` - Tickets Individuels
- `id` - Identifiant unique
- `ticketId` - ID unique du ticket
- `userId` - ID du créateur
- `guildId` - ID du serveur Discord
- `channelId` - ID du canal créé
- `ticketType` - Type/catégorie du ticket
- `status` - Statut (`open` | `closed`)
- `createdAt` - Date de création
- `closedAt` - Date de fermeture

---

## 🎨 Personnalisation

### **Styles de Boutons**
| Style | Couleur | Usage Recommandé |
|-------|---------|------------------|
| `1` - Primaire | 🔵 Bleu | Actions principales |
| `2` - Secondaire | ⚪ Gris | Actions secondaires |
| `3` - Succès | 🟢 Vert | Confirmations positives |
| `4` - Danger | 🔴 Rouge | Actions destructives |

### **Permissions Requises**
- `Gérer les Canaux` - Pour créer/supprimer les tickets
- `Gérer les Rôles` - Pour la gestion des rôles
- `Envoyer des Messages` - Pour les interactions
- `Utiliser les Emojis Externes` - Pour les emojis personnalisés

---

## 🛠️ Scripts Utiles

```bash
# Développement avec rechargement automatique
npm run dev

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
