import moment from "moment-timezone";

export default function createTimeSlots(fromTime, toTime, bookedSlotsSet, selectedDate) {
    const timeSlotInterval = 30
    let startTime = moment(fromTime, "HH:mm");
    let endTime = moment(toTime, "HH:mm");
    let currentTime = moment.tz("Asia/Singapore").format("HH:mm");
    let currentDate = moment();
    if (endTime.isBefore(startTime)) {
      endTime.add(1, "day");
    }
    let arr = [];

    while (startTime <= endTime) {
        if (currentDate.isSame(selectedDate, 'day') && moment(currentTime, "HH:mm").isAfter(moment(startTime, "HH:mm"))) {
            startTime.add(
              timeSlotInterval ? timeSlotInterval : 30,
              "minutes"
            );
            } else {
                if (!bookedSlotsSet.has(startTime.format("HH:mm"))) {
                  arr.push(startTime.format("HH:mm"));
                }
                startTime.add(
                  timeSlotInterval ? timeSlotInterval : 30,
                  "minutes"
                );        
            }            
    }
    return arr;
}