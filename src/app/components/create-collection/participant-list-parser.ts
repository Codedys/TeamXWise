export interface ParsedParticipantList {
  names: string[];
  ignoredLines: number;
}

function tidyCapitalization(name: string): string {
  return name
    .split(/(\s+)/)
    .map((word, index) => {
      if (index > 0 && /^(?:de|del|da|dos|du|la|le|van|von|bin|al)$/iu.test(word)) {
        return word.toLocaleLowerCase();
      }
      if (word !== word.toLocaleLowerCase() && word !== word.toLocaleUpperCase())
        return word;
      return word
        .toLocaleLowerCase()
        .replace(
          /(^|[-’'])(\p{L})/gu,
          (_, separator: string, letter: string) =>
            separator + letter.toLocaleUpperCase(),
        );
    })
    .join('');
}

// Spaces within a full name stay intact. Only explicit list separators split people.
const NAME_SEPARATOR =
  /[,;\t]+|\s+(?:and|&|ja|(?:along|together)\s+with|with|as\s+well\s+as|plus)\s+/iu;
const LIST_PREFIX =
  /^(?:(?:the\s+)?(?:names|participants|attendees|people|guest\s+list|trip\s+list(?:\s+[\p{L}\d-]+)?)|(?:we(?:[’']re|\s+are)\s+)?coming)\s*:\s*/iu;
const ATTENDANCE_SUFFIX =
  /\s+(?:(?:(?:is|are|am|will\s+be)\s+)?(?:(?:also|all)\s+)?(?:coming|joining|attending)(?:\s+(?:too|along|together))?|will\s+(?:also\s+)?(?:come|join|attend)(?:\s+too)?)$/iu;
// Reject leftover sentence fragments instead of counting them as a person.
const CHAT_FRAGMENT =
  /(?:^|\s)(?:(?:is|are|am|will|can|might|should|would)\s+(?:not\s+)?(?:be|come|coming|join|joining|attend|attending|bring|pay)\b|(?:isn[’']t|aren[’']t|won[’']t|can[’']t)\s+|(?:coming|joining|attending)\s+(?:to|for|at|on|the)\b|(?:please|thanks|thank\s+you)(?:\s|$))/iu;
const NAME_WORDS =
  /^[\p{L}\p{M}]+(?:[’'\-][\p{L}\p{M}]+)*\.?(?:\s+[\p{L}\p{M}]+(?:[’'\-][\p{L}\p{M}]+)*\.?)*$/u;

function cleanName(part: string): string | null {
  if (
    /(?:^|\s)(?:not|never|isn[’']t|aren[’']t|won[’']t|can[’']t|cannot)\s+(?:be\s+)?(?:come|coming|join|joining|attend|attending)\b/iu.test(
      part,
    )
  )
    return null;
  const name = part
    .replace(/^\s*(?:(?:\d+[.)\]:-])|[-*•–—])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[!?]+$/u, '')
    // Preserve surname initials such as "Karl R." while removing sentence full stops.
    .replace(/(\p{L}{2})\.$/u, '$1')
    .replace(ATTENDANCE_SUFFIX, '')
    .trim();
  if (
    !NAME_WORDS.test(name) ||
    CHAT_FRAGMENT.test(name) ||
    /^(?:hi|hey|hello|coming|joining|attending|along|together)$/iu.test(name)
  )
    return null;
  return tidyCapitalization(name);
}

/** Predictable input cleanup; every result remains editable by the organiser. */
export function parseParticipantList(raw: string): ParsedParticipantList {
  const names: string[] = [];
  let ignoredLines = 0;
  for (const original of raw.split(/\r?\n/)) {
    const line = original.normalize('NFC').trim();
    if (!line) continue;
    if (line.endsWith(':')) {
      ignoredLines++;
      continue;
    }
    const withoutEmails = line
      .replace(/\([^)]*[\w.+-]+@[\w.-]+\.[\p{L}]{2,}[^)]*\)/gu, '')
      .replace(/<?[\w.+-]+@[\w.-]+\.[\p{L}]{2,}>?/gu, '')
      .replace(/\(\s*\)/g, '')
      .replace(LIST_PREFIX, '');
    let added = 0;
    for (const part of withoutEmails.split(NAME_SEPARATOR)) {
      const name = cleanName(part);
      if (!name) continue;
      names.push(name);
      added++;
    }
    if (!added) ignoredLines++;
  }
  return { names, ignoredLines };
}
