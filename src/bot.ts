import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
console.log("Bot is running...");

const prisma = new PrismaClient();
const getGroups = async () => {
  try {
    const groups = await prisma.group.findMany({
      take: 25,
      orderBy: {
        createdAt: "desc",
      },
    });
    return groups;
  } catch (err) {
    console.error("Error fetching active groups:", err);
    return [];
  }
};
const getActiveGroups = async () => {
  try {
    const activeGroups = await prisma.group.findMany({
      where: { status: "active" },
    });
    return activeGroups;
  } catch (err) {
    console.error("Error fetching active groups:", err);
    return [];
  }
};
const getGroupById = async (id: number) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id },
    });
    return group;
  } catch (err) {
    console.error("Error fetching active groups:", err);
    return [];
  }
};
const addGroup = async (id: bigint, name: string) => {
  const group = await prisma.group.create({
    data: {
      id: id,
      name: name,
      status: "active",
    },
  });

  return group;
};
const deleteGroup = async (id: number) => {
  const group = await getGroupById(id);
  if (!group) return;

  const deleted = await prisma.group.delete({ where: { id } });
  return deleted;
};
const updateGroupStatus = async (id: number, status: string) => {
  const updated = await prisma.group.update({
    where: { id },
    data: { status },
  });
  return updated;
};

// Telegram Bot
const token = process.env.TG_BOT_TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

// Admins who can execute the bot
const adminIds = [1815073508];
const isAdmin = (userId: number) => adminIds.includes(userId);

// Broadcast variables
let broadcastMode = false;
let broadcastMessage = "";

const welcomeMessage = `
TokenMinds Group Broadcast Bot!
Here are the available commands:\n
1. /groups - Check listed group IDs (Limit: 25).\n
2. /status <groupId> <active/inactive> - Change group status.\n
3. /broadcast - Toggle broadcast mode.\n
`;
bot.onText(/\/start/, (msg) => {
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    return;
  }

  bot.sendMessage(msg.chat.id, welcomeMessage);
});

// Add group when bot invited & deleted group when bot is kicked
bot.getMe().then((botInfo) => {
  const botId = botInfo.id;

  bot.on("new_chat_members", async (msg) => {
    const newMembers = msg.new_chat_members;
    const botInfo = await bot.getMe();
    const botId = botInfo.id;

    newMembers?.forEach(async (member) => {
      if (member.id === botId) {
        const chatId = msg.chat.id;
        const groupName = msg.chat.title as string;

        try {
          const newGroup = await addGroup(BigInt(chatId), groupName);
          console.log(
            `Added group: Name: ${newGroup.name}, ID: ${newGroup.id}`
          );
        } catch (err) {
          console.error("Error adding group:", err);
        }
      }
    });
  });

  bot.on("left_chat_member", async (msg) => {
    const botInfo = await bot.getMe();
    const botId = botInfo.id;

    if (msg.left_chat_member?.id === botId) {
      const chatId = msg.chat.id;

      try {
        await deleteGroup(chatId);
        console.log(`Removed group ID: ${chatId}`);
      } catch (err) {
        console.error("Error removing group:", err);
      }
    }
  });
});

// Listen for /groups command
bot.onText(/\/groups/, async (msg) => {
  const chatId = msg.chat.id;

  // Command should only triggered via private chat with bot
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    return;
  }

  // Create a formatted list of group names, IDs, and status
  const groups = await getGroups();
  const groupListMessage =
    groups.length > 0
      ? `*List of Groups:*\n\n` +
        groups
          .map(
            (group: any) =>
              `*${group.name}* | \`${group.id}\` | *${
                group.status === "active" ? "🟢" : "🔴"
              }*`
          )
          .join("\n")
      : "*No groups stored yet.*";

  // Send the formatted message
  bot.sendMessage(chatId, groupListMessage, { parse_mode: "Markdown" });
});

bot.onText(/\/status\s+(-?\d+)\s+(active|inactive)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;

  // Command should only be triggered via private chat with the bot
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    return;
  }

  // Check if the user is an admin
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "You do not have permission to use this command.");
    return;
  }

  // Ensure match is valid before accessing it
  if (!match) {
    bot.sendMessage(
      chatId,
      "Invalid command format. Usage: /status <groupID> <status>"
    );
    return;
  }

  // Extract groupID and status from the command
  const groupId = parseInt(match[1], 10); // Use match[1] for the group ID
  const status = match[2] as "active" | "inactive"; // Type assertion

  // Validate groupID
  const group = await getGroupById(groupId);
  if (!group) {
    bot.sendMessage(chatId, `Group ID \`${groupId}\` not found.`, {
      parse_mode: "Markdown",
    });
    return;
  }

  // Change the group's status
  const updated = await updateGroupStatus(groupId, status);
  bot.sendMessage(
    chatId,
    `The status of group *${updated.name}* (ID: \`${
      updated.id
    }\`) has been updated to *${
      status === "active" ? "🟢 Active" : "🔴 Inactive"
    }*.`,
    { parse_mode: "Markdown" }
  );
});

// Listen for /broadcast command to enter broadcast mode
bot.onText(/\/broadcast/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;

  // Command should only be triggered via private chat with the bot
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    return;
  }

  // Check if admin
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "You do not have permission to use this command.");
    return;
  }

  // Set the bot to broadcast mode for the user who issued the command
  broadcastMode = true;
  bot.sendMessage(
    chatId,
    "Broadcast mode enabled. Please send a media file (photo, video, etc.) with a caption, or just type the message to broadcast. Type /cancel to cancel the broadcast."
  );
});

// Listen for /cancel command to exit broadcast / schedule mode
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;

  if (broadcastMode) {
    broadcastMode = false;
    broadcastMessage = "";
    bot.sendMessage(chatId, "Broadcast mode has been canceled.");
  } else {
    bot.sendMessage(chatId, "You are not in broadcast/schedule mode.");
  }
});

// Listen for media (photo, video, etc.) or a text message after /broadcast command
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!broadcastMode) return;

  const activeGroups = await getActiveGroups();
  if (activeGroups.length === 0) {
    bot.sendMessage(chatId, "No active groups to send the broadcast.");
    broadcastMode = false;
    return;
  }

  // Check if the message contains media (photo, video, etc.)
  if (msg.photo || msg.video || msg.document) {
    let mediaType: "photo" | "video" | "document" | undefined;
    let mediaFileId: string | undefined;
    let caption = msg.caption || broadcastMessage;

    if (msg.photo) {
      mediaType = "photo";
      mediaFileId = msg.photo[msg.photo.length - 1].file_id; // Get highest resolution photo
    } else if (msg.video) {
      mediaType = "video";
      mediaFileId = msg.video.file_id;
    } else if (msg.document) {
      mediaType = "document";
      mediaFileId = msg.document.file_id;
    }

    // Broadcast the media with the caption to all active groups
    for (const group of activeGroups) {
      try {
        if (mediaFileId && mediaType === "photo") {
          await bot.sendPhoto(group.id.toString(), mediaFileId, {
            caption,
            parse_mode: "Markdown",
          });
        } else if (mediaFileId && mediaType === "video") {
          await bot.sendVideo(group.id.toString(), mediaFileId, {
            caption,
            parse_mode: "Markdown",
          });
        } else if (mediaFileId && mediaType === "document") {
          await bot.sendDocument(group.id.toString(), mediaFileId, {
            caption,
            parse_mode: "Markdown",
          });
        }
      } catch (err) {
        console.error(`Failed to send message to ${group.id}:`, err);
      }
    }

    bot.sendMessage(chatId, "Broadcast sent with media to all active groups.");
  } else if (msg.text && msg.text !== "/cancel") {
    broadcastMessage = msg.text;
    for (const group of activeGroups) {
      try {
        await bot.sendMessage(group.id.toString(), broadcastMessage, {
          parse_mode: "Markdown",
        });
      } catch (err) {
        console.error(`Failed to send message to ${group.id}:`, err);
      }
    }
    bot.sendMessage(chatId, "Text broadcast sent to all active groups.");
  }

  // Reset broadcast mode after sending the message
  broadcastMode = false;
  broadcastMessage = "";
});
