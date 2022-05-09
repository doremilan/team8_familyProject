const User = require('../schemas/user');
const FamilyMember = require('../schemas/familyMember');
const PhotoAlbum = require('../schemas/photoAlbum');
const Photo = require('../schemas/photo');
const Comment = require('../schemas/comment');
const Like = require('../schemas/like');

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

// 사진생성
const postPhoto = async (req, res) => {
  const { familyId, photoAlbumId } = req.params;
  const { userId } = res.locals.user;
  const photoFile = req.file.location;
  const createdAt = new Date();

  try {
    // 공백 체크
    if (photoFile !== null) {
      const createdPhoto = await Photo.create({
        familyId,
        photoAlbumId,
        userId,
        photoFile,
        createdAt,
      });
      res.status(201).json({
        photoId: createdPhoto.photoId,
        msg: '사진이 등록되었어요.',
      });
    } else {
      res.status(400).send({
        result: false,
        msg: '사진을 업로드해주세요.',
      });
    }
  } catch (error) {
    console.log('사진 등록 오류', error);
    res.status(400).send({
      result: false,
      msg: '사진 등록 실패',
    });
  }
};

// 사진 목록조회
const getPhoto = async (req, res) => {
  const { photoAlbumId } = req.params;
  try {
    const photoList = await Photo.find({ photoAlbumId }).sort('-createdAt');
    const photoAlbum = await PhotoAlbum.findOne({ _id: photoAlbumId });
    const PhotoAlbumName = photoAlbum.photoAlbumName;

    res.status(200).json({
      PhotoAlbumName,
      photoList,
    });
  } catch (error) {
    console.log('사진 목록조회 오류', error);
    res.status(400).send({
      result: false,
      msg: '사진 목록조회 실패',
    });
  }
};

// 사진 상세조회 & 댓글 목록조회
const getPhotoDetail = async (req, res) => {
  const { photoId } = req.params;
  const { userId } = res.locals.user;

  try {
    // 사진 등록 유저 정보 추출
    const detailPhoto = await Photo.findOne({ _id: photoId });
    if (detailPhoto) {
      const photoUser = await User.findOne({ _id: detailPhoto.userId });
      if (photoUser) {
        const userInfo = await FamilyMember.findOne({
          userId: photoUser.userId,
        });
        detailPhoto.userInfo = userInfo;
      }
    }
    // 댓글 목록 & 댓글 수
    const commentList = await Comment.find({ photoId }).sort('-createdAt');
    const totalComment = commentList.length;
    if (commentList) {
      for (let comment of commentList) {
        const userInfo = await FamilyMember.findOne({
          userId: comment.userId,
        });
        comment.userInfo = userInfo;
      }
    }
    // 좋아요 누른 멤버
    let likeMemberList = [];
    const likedMembers = await Like.find({ photoId });
    if (!likedMembers) {
      likeMemberList = [];
    } else {
      for (let likedMember of likedMembers) {
        likeMemberList = await FamilyMember.find({
          userId: likedMember.userId,
        });
      }
    }
    // 좋아요 체크
    const userLike = await Like.findOne({ photoId, userId });
    let likeChk = false;
    if (userLike) {
      likeChk = true;
    }
    res.status(200).json({
      detailPhoto,
      likeChk,
      totalComment,
      commentList,
      likeMemberList,
    });
  } catch (error) {
    console.log('사진 상세조회 오류', error);
    res.status(400).send({
      result: false,
      msg: '사진 상세조회 실패',
    });
  }
};

// 사진수정
const putPhoto = async (req, res) => {
  const { photoId } = req.params;
  const photoFile = req.file.location;

  try {
    // 공백 체크
    if (photoFile !== null) {
      const existPhoto = await Photo.findOne({ _id: photoId });
      if (existPhoto) {
        await Photo.updateOne({ _id: photoId }, { $set: { photoFile } });
        res.status(200).json({
          photoFile,
          msg: '사진이 수정되었어요.',
        });
      }
    } else {
      res.status(400).send({
        result: false,
        msg: '공란을 작성해주세요.',
      });
    }
  } catch (error) {
    console.log('사진 수정 오류', error);
    res.status(400).send({
      result: false,
      msg: '사진 수정 실패',
    });
  }
};

// 사진삭제
const deletePhoto = async (req, res) => {
  const { photoId } = req.params;

  try {
    const existPhoto = await Photo.findOne({ _id: photoId });
    // 사진, 댓글, 좋아요 모두 삭제
    if (existPhoto) {
      await Photo.deleteOne({ _id: photoId });
      await Comment.deleteMany({ photoId });
      await Like.deleteMany({ photoId });
      res.status(200).json({
        result: true,
        msg: '사진이 삭제되었어요.',
      });
    }
  } catch (error) {
    console.log('사진 삭제 오류', error);
    res.status(400).send({
      result: false,
      msg: '사진 삭제 실패',
    });
  }
};

module.exports = {
  postPhoto,
  getPhoto,
  getPhotoDetail,
  putPhoto,
  deletePhoto,
};