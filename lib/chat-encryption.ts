import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ENCRYPTED_PREFIX = "enc:v1:"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
export { MAX_CHAT_MESSAGE_BYTES } from "@/lib/chat-constants"

type MessageContext = { conversationId: string; senderId: string }

function getEncryptionKey() {
  const configuredKey = process.env.CHAT_ENCRYPTION_KEY
  if (!configuredKey) throw new Error("CHAT_ENCRYPTION_KEY is not configured")

  const key = Buffer.from(configuredKey, "base64url")
  if (key.length !== 32) throw new Error("CHAT_ENCRYPTION_KEY must be a base64url-encoded 32-byte key")
  return key
}

function getAdditionalData({ conversationId, senderId }: MessageContext) {
  return Buffer.from(`chat-message:v1:${conversationId}:${senderId}`, "utf8")
}

export function isEncryptedChatMessage(value: string) {
  return value.startsWith(ENCRYPTED_PREFIX)
}

export function encryptChatMessage(plaintext: string, context: MessageContext) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  cipher.setAAD(getAdditionalData(context))
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`
}

export function decryptChatMessage(value: string, context: MessageContext) {
  if (!isEncryptedChatMessage(value)) return value

  const payload = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64url")
  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) throw new Error("Stored chat message ciphertext is malformed")

  const iv = payload.subarray(0, IV_LENGTH)
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv)
  decipher.setAAD(getAdditionalData(context))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
