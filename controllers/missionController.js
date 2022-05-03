const User = require('../schemas/user');
const FamilyMember = require('../schemas/familyMember');
const Mission = require('../schemas/mission');
const MissionMember = require('../schemas/missionmember');
const MissionChk = require('../schemas/missionChk');

// 미션등록
const postMission = async (req, res) => {
  const { familyId } = req.params;
  const { userId } = res.locals.user;
  const { missionTitle, familyMemberId } = req.body;
  const createdAt = new Date();

  try {
    // 공백 체크
    if (missionTitle !== null && missionTitle !== '') {
      const createdMission = await Mission.create({
        missionTitle,
        userId,
        familyId,
        createdAt,
      });
      const MissionId = await Mission.findById({
        _id: createdMission._id,
      });
      // 미션 멤버 db 생성
      for (let MemberId of familyMemberId) {
        const [missionMemberList] = await FamilyMember.find({
          familyMemberId: MemberId.familyMemberId,
        });
        const familyMemberId = missionMemberList.familyMemberId; //배열인데 이렇게 빼지나? 체크필요
        // 공백 체크
        if (missionMemberList) {
          await MissionMember.create({
            MissionId,
            familyMemberId,
            missionMemberList,
          });
        }
      }
      res.status(201).json({
        msg: '새로운 미션이 등록되었어요.',
      });
    } else {
      res.status(400).send({
        result: false,
        msg: '미션 제목을 작성해주세요.',
      });
    }
  } catch (error) {
    console.log('미션 등록 오류', error);
    res.status(400).send({
      result: false,
      msg: '미션 등록 실패',
    });
  }
};

// 미션 완료 체크
const completeMission = async (req, res) => {
  const { missionId } = req.params;
  const { userId } = res.locals.user;
  const { myMissionChk, familyMissionChk, completedAt } = req.body;

  try {
    //개인미션 체크
    if (myMissionChk) {
      await MissionChk.deleteOne({ missionId, userId });
      let myMissionChk = false;
      res.status(200).json({
        myMissionChk,
        familyMissionChk,
      });
    } else {
      await MissionChk.create({ missionId, userId });
      let myMissionChk = true;
      //전체미션 체크
      const [missionMember] = await MissionMember.find({ missionId });
      const [completedMember] = await MissionChk.find({ missionId });
      if (missionMember.length === completedMember.length) {
        return (familyMissionChk = true);
      }
      res.status(200).json({
        myMissionChk,
        familyMissionChk,
        completedAt,
      });
    }
  } catch (error) {
    console.log('미션체크 오류', error);
    res.status(400).send({
      result: false,
      msg: '미션체크 실패',
    });
  }
};

// 이번달 미션 목록조회
const getMission = async (req, res) => {
  const { familyId } = req.params;

  try {
    // 이번달 미션 리스트 & 전체 미션 수 추출
    const thisMonth = new Date().getMonth();
    const Missions = await Mission.find({ familyId }).sort('-createdAt');
    const thisMonthMissionList = [];
    let totalMission = 0;
    let completedMission = 0;
    for (let mission of Missions) {
      if (mission.createdAt.getMonth() === thisMonth) {
        thisMonthMissionList.push(mission);
        totalMission += 1;
        // 각 미션 멤버 리스트 & 미션완료 여부 체크
        const [completedMembers] = await MissionChk.find({
          missionId: mission.missionId,
        });
        const [missionMembers] = await MissionMember.find({
          missionId: mission.missionId,
        });
        for (let missionMember of missionMembers) {
          for (let completedMember of completedMembers) {
            if (
              missionMember.familyMemberId === completedMember.familyMemberId
            ) {
              let myMissionChk = true; //false값도 가는지 체크
              missionMember.myMissionChk = myMissionChk; //myMissionChk값 db에 만들어야 하는지 체크
            }
          }
        }
        mission.missionMemberList = missionMembers.missionMemberList; //코드위치체크, 배열체크, missionMembers db에 만들어야 하는지 체크
        // 각 미션 전체 달성완료 여부 체크 & 완료된 미션 수 추출
        if (missionMembers.length === completedMembers.length) {
          let familyMissionChk = true;
          mission.familyMissionChk = familyMissionChk; //값 db에 만들어야 하는지 체크
          completedMission += 1;
        }
      }
    }
    // 미션 달성률 계산
    const Percentage = (completedMission / totalMission) * 100;
    const completePercentage = Math.floor(Percentage);
    res.status(200).json({
      totalMission,
      completedMission,
      completePercentage,
      thisMonthMissionList,
      //totalBadge 추가필요 (추후작업예정)
    });
  } catch (error) {
    console.log('미션 목록조회 오류', error);
    res.status(400).send({
      result: false,
      msg: '미션 목록조회 실패',
    });
  }
};

// 지난 미션 목록조회 (추후 무한스크롤 구현 필요)
const getPastMission = async (req, res) => {
  const { familyId } = req.params;

  try {
    const thisMonth = new Date().getMonth();
    const Missions = await Mission.find({ familyId }).sort('-createdAt');
    // 지난 미션 리스트 조회
    const pastMissionList = [];
    for (let mission of Missions) {
      if (mission.createdAt.getMonth() !== thisMonth) {
        pastMissionList.push(mission);
        // 각 미션 멤버 리스트 & 미션완료 여부 체크
        const [completedMembers] = await MissionChk.find({
          missionId: mission.missionId,
        });
        const [missionMembers] = await MissionMember.find({
          missionId: mission.missionId,
        });
        for (let missionMember of missionMembers) {
          for (let completedMember of completedMembers) {
            if (
              missionMember.familyMemberId === completedMember.familyMemberId
            ) {
              let myMissionChk = true; //false값도 가는지 체크
              missionMember.myMissionChk = myMissionChk; //myMissionChk값 db에 만들어야 하는지 체크
            }
          }
        }
        mission.missionMemberList = missionMembers.missionMemberList; //코드위치체크, 배열체크, missionMembers db에 만들어야 하는지 체크
        // 각 미션 전체 달성완료 여부 체크 & 완료된 미션 수 추출
        if (missionMembers.length === completedMembers.length) {
          let familyMissionChk = true;
          mission.familyMissionChk = familyMissionChk; //값 db에 만들어야 하는지 체크
        }
      }
    }
    res.status(200).json({
      pastMissionList,
    });
  } catch (error) {
    console.log('지난미션 목록조회 오류', error);
    res.status(400).send({
      result: false,
      msg: '지난미션 목록조회 실패',
    });
  }
};

// 미션 멤버 목록조회(멤버추가 시 사용)
const getfamilyMemberList = async (req, res) => {
  const { familyId } = req.params;

  try {
    const [familyMemberList] = await FamilyMember.find({ familyId });
    res.status(200).json({
      familyMemberList,
    });
  } catch (error) {
    console.log('멤버 조회 오류', error);
    res.status(400).send({
      result: false,
      msg: '멤버 조회 실패',
    });
  }
};

// 사진삭제
const deleteMission = async (req, res) => {
  const { missionId } = req.params;

  try {
    const existMission = await Mission.findOne({ missionId });
    // 미션, 미션멤버, 미션체크 모두 삭제
    if (existMission) {
      await Mission.deleteOne({ missionId });
      await MissionMember.deleteMany({ missionId });
      await MissionChk.deleteMany({ missionId });
      // 이번달 전체 미션 수 추출
      const thisMonth = new Date().getMonth();
      const Missions = await Mission.find({ familyId }).sort('-createdAt');
      let totalMission = 0;
      let completedMission = 0;
      for (let mission of Missions) {
        if (mission.createdAt.getMonth() === thisMonth) {
          totalMission += 1;
          // 각 미션 전체 달성완료 여부 체크 & 완료된 미션 수 추출
          const [completedMembers] = await MissionChk.find({
            missionId: mission.missionId,
          });
          const [missionMembers] = await MissionMember.find({
            missionId: mission.missionId,
          });
          if (missionMembers.length === completedMembers.length) {
            completedMission += 1;
          }
        }
      }
      // 미션 달성률 계산
      const Percentage = (completedMission / totalMission) * 100;
      const completePercentage = Math.floor(Percentage);

      res.status(204).json({
        totalMission,
        completedMission,
        completePercentage,
        //totalBadges, (추후추가)
      });
    }
  } catch (error) {
    console.log('미션 삭제 오류', error);
    res.status(400).send({
      result: false,
      msg: '미션 삭제 실패',
    });
  }
};

module.exports = {
  postMission,
  completeMission,
  getMission,
  getPastMission,
  getfamilyMemberList,
  deleteMission,
};
