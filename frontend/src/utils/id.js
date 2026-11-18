// Unambiguous alphabet (no 0/O/1/I) so IDs are easy to read aloud and type.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateBusinessId(exists = () => false) {
  let id
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    id = 'FAI-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  } while (exists(id))
  return id
}
export const uid = (p) => `${p}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`
