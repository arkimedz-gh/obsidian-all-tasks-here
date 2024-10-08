import { DateTime } from 'luxon';

export class DateParser {
  public static DateToken = '%date%';
  private tagFormat: string;
  private dateFormat: string;
  private regexp: RegExp;

  constructor(tagFormat: string, dateFormat: string) {
    if (!tagFormat.includes(DateParser.DateToken)) {
      throw new Error(`Tag format must include the ${DateParser.DateToken} token.`);
    }
    this.tagFormat = tagFormat;
    this.dateFormat = dateFormat;

    const explanation = DateTime.fromFormatExplain('x', dateFormat);
    const pattern = explanation.regex;
    const patternString = pattern.toString().replace('/^', '').replace('$/i', '');

    const formatPattern = stringToPattern(tagFormat);
    const fullPattern = formatPattern.replace(new RegExp(DateParser.DateToken), `(${patternString})`);
    this.regexp = new RegExp(fullPattern);
  }

  public parseDate(source: string): DateTime | undefined {
    const matches = source.match(this.regexp);
    if (!matches) {
      return undefined;
    }
    return DateTime.fromFormat(matches[1], this.dateFormat);
  }

  public removeDate(source: string): string {
    return source.replace(this.regexp, '').trim();
  }
}

const stringToPattern = (rawString: string) => {
  return rawString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};