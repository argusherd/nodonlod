import { formatSeconds } from "@/src/neat-duration";

describe("The dayjs neat-duration plugin implementation", () => {
  it("formats less than 600 seconds to 3 digits", () => {
    expect(formatSeconds(0)).toEqual("0:00");
    expect(formatSeconds(1)).toEqual("0:01");
    expect(formatSeconds(60)).toEqual("1:00");
    expect(formatSeconds(599)).toEqual("9:59");
  });

  it("formats less than 1 hour (3,600 seconds) to 4 digits", () => {
    expect(formatSeconds(600)).toEqual("10:00");
    expect(formatSeconds(1000)).toEqual("16:40");
    expect(formatSeconds(3599)).toEqual("59:59");
  });

  it("formats less then 10 hours (36,000 seconds) to 5 digits", () => {
    expect(formatSeconds(3600)).toEqual("1:00:00");
    expect(formatSeconds(10000)).toEqual("2:46:40");
    expect(formatSeconds(35999)).toEqual("9:59:59");
  });

  it("formats greater than or equal to 100 hours (360,000 seconds) to 6 or more digits", () => {
    expect(formatSeconds(36000)).toEqual("10:00:00");
    expect(formatSeconds(100000)).toEqual("27:46:40");
    expect(formatSeconds(359999)).toEqual("99:59:59");
    expect(formatSeconds(360000)).toEqual("100:00:00");
    expect(formatSeconds(3600000)).toEqual("1000:00:00");
  });
});
