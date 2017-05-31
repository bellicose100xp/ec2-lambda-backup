let AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';

let ec2 = new AWS.EC2();
const myInstanceId = 'i-097633d31fc200b20';

var paramsVolumeDecribe = {
    Filters: [
        {
            Name: "attachment.instance-id",
            Values: [myInstanceId]
        }
    ]
};

let myVolumeId = '';

ec2.describeVolumes(paramsVolumeDecribe, (err, data) => {
    if (err) console.log(err, err.stack)
    else {
        myVolumeId = data.Volumes[0].VolumeId;
        // console.log(`volume to be snapshotted: ${myVolumeId}`);

        let dateForSnapshot = new Date();
        let paramsSnapshotCreation = {
            VolumeId: myVolumeId, /* required */
            Description: `Linux Test AMI Snapshot On: ${dateForSnapshot}`
            //   DryRun: true
        };

        ec2.createSnapshot(paramsSnapshotCreation, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                // console.log(data)

                let paramsSnapshotList = {
                    Filters: [
                        {
                            Name: 'volume-id',
                            Values: [myVolumeId]
                        }
                    ]
                }

                ec2.describeSnapshots(paramsSnapshotList, function (err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                       // console.log(data)
                        let deleteSnapshotBeforeMins = 2;
                        let snapshots = data.Snapshots

                        snapshots.forEach(function (snap) {
                            //   console.log(snap.Description.split(': ')[1]);
                            let mydateString = snap.Description.split(': ')[1]
                            let mySnapShot = snap.SnapshotId;
                            let mydate = new Date(mydateString);
                            //   console.log(mydate.toString());
                            let someMinuteAgo = new Date();
                            someMinuteAgo.setMinutes(someMinuteAgo.getMinutes() - deleteSnapshotBeforeMins);
                            if (mydate < someMinuteAgo) {
                                var paramsDeleteSnapshot = {
                                    SnapshotId: mySnapShot
                                };
                                ec2.deleteSnapshot(paramsDeleteSnapshot, function (err, data) {
                                    if (err) console.log(err, err.stack); // an error occurred
                                    else console.log(`successfully deleted ${snap.Description}`);           // successful response
                                });
                            }
                        });

                    };           // successful response for create snapshot
                });

            };           // successful response to create snapshot
        });
    }
})


