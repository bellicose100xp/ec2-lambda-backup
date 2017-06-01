let AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';

// supply params for instaces that needs to be snapshotted
let instanceTagName = 'my-name';
let instanceTagValue = 'linux-test';

//Testing Only
let deleteSnapshotBeforeMins = 2;

//Production Only
let deleteSnapshotBeforeDays = 2;

// pre-declared variables, do not modify

let ec2 = new AWS.EC2();
let paramsDescribeIns = {
    Filters: [
        {
            Name: `tag:${instanceTagName}`,
            Values: [instanceTagValue]
        }
    ]
}

let describeInstancesPromise = ec2.describeInstances(paramsDescribeIns).promise();

describeInstancesPromise.then(data => {
    let myInstanceId = data.Reservations[0].Instances[0].InstanceId;
    let paramsDescribeVol = {
        Filters: [
            {
                Name: "attachment.instance-id",
                Values: [myInstanceId]
            }
        ]
    }
    return ec2.describeVolumes(paramsDescribeVol).promise()
}, err => {
    console.log(err, err.stack)
}).then(data => {
    let myVolumeId = data.Volumes[0].VolumeId;
    // console.log(`volume to be snapshotted: ${myVolumeId}`);
    let dateForSnapshot = new Date()
    let paramsSnapshotCreation = {
        VolumeId: myVolumeId, /* required */
        Description: `Linux Test AMI Snapshot On: ${dateForSnapshot}`
        //   DryRun: true
    };
    return ec2.createSnapshot(paramsSnapshotCreation).promise()
}, err => {
    console.log(err, err.stack)
}).then(data => {
    let myVolumeId = data.VolumeId;
    let paramsSnapshotList = {
        Filters: [
            {
                Name: 'volume-id',
                Values: [myVolumeId]
            }
        ]
    }
    return ec2.describeSnapshots(paramsSnapshotList).promise()
}, err => {
    console.log(err, err.stack)
}).then(data => {
    let snapshots = data.Snapshots
    snapshots.forEach(function (snap) {
        //   console.log(snap.Description.split(': ')[1]);
        let mydateString = snap.Description.split(': ')[1]
        let mySnapShot = snap.SnapshotId;
        let mydate = new Date(mydateString);
        //   console.log(mydate.toString());
        //test only
        let someTimeAgo = new Date();
        someTimeAgo.setMinutes(someTimeAgo.getMinutes() - deleteSnapshotBeforeMins);

        // let someTimeAgo = new Date();
        // someTimeAgo.setDate(someTimeAgo.getDate() - deleteSnapshotBeforeDays);
        //chnage days/minutes here after test is done
        if (mydate < someTimeAgo) {
            var paramsDeleteSnapshot = {
                SnapshotId: mySnapShot
            };
            ec2.deleteSnapshot(paramsDeleteSnapshot, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(`successfully deleted ${snap.Description}`);
            });
        }
    })
}, err => {
    console.log(err, err.stack)
})
