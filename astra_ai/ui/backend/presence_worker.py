"""Trusted local image worker. Frames are never persisted or sent to a provider."""
import base64,json,sys
import cv2
import numpy as np
cv2.setNumThreads(1);cv2.ocl.setUseOpenCL(False)
face=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
hog=cv2.HOGDescriptor();hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
print('{"status":"ready"}',flush=True)
for line in sys.stdin:
    try:
        value=json.loads(line)
        data=base64.b64decode(value['jpeg'],validate=True)
        if len(data)>100000:raise ValueError()
        image=cv2.imdecode(np.frombuffer(data,np.uint8),cv2.IMREAD_COLOR)
        if image is None or image.shape[0]*image.shape[1]>1920000:raise ValueError()
        height,width=image.shape[:2];image=cv2.resize(image,(320,max(96,min(240,int(height*320/width)))))
        faces=face.detectMultiScale(cv2.cvtColor(image,cv2.COLOR_BGR2GRAY),scaleFactor=1.15,minNeighbors=5,minSize=(24,24))
        people=[] if len(faces) else hog.detectMultiScale(image,winStride=(8,8),padding=(8,8),scale=1.15)[0]
        print(json.dumps({'detected':bool(len(faces) or len(people))}),flush=True)
    except Exception:print('{"status":"unknown"}',flush=True)
