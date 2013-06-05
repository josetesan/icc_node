import redis
import csv
import sys
csvfile = open(sys.argv[1],'r')
reader = csv.DictReader(csvfile,delimiter=';')
r = redis.StrictRedis(host='localhost', port=6379, db=0)
for row in reader:
    print 'inserting tac CODE %s' % row['TAC']
    r.sadd('device:%s' % row['TAC'],
    'brand:%s' % row['BRAND'],
    'model:%s' % row['MODEL'],
    'device_type:%s' % row['DEVICE_TYPE'],
    'os:%s' % row['OS'],
    'info:%s' % row['ADDITIONALINFO'],
    'band:%s' % row['BAND'],
    'gprs:%s' % row['GPRS'],
    'edge:%s' % row['EDGE'],
    'wifi:%s' % row['WI-FI'],
    'wap_browser:%s' % row['WAP/BROWSER'],
    'bluetooth:%s' % row['BLUETOOTH'],
    'gps:%s' % row['GPS'],
    'display_type:%s' % row['DISPLAY_TYPE'],
    'display_size:%s' % row['DISPLAY_SIZE'],
    'messaging:%s' % row['MESSAGING'],
    'primary_camera:%s' % row['PRIMARY_CAMERA'],
    'secondary_camera:%s' % row['SECONDARY_CAMERA'],
    'video:%s' % row['VIDEO'],
    'dimensions:%s' % row['DIMENSIONS'],
    'weight:%s' % row['WEIGHT'],
    'internal_memory:%s' % row['INTERNAL_MEMORY'],
    'memory_card_slot:%s' % row['MEMORY_CARD_SLOT'],
    'infrared:%s' % row['INFRARED'],
    'usb:%s' % row['USB'],
    'cpu:%s' % row['CPU'],
    'java:%s' % row['JAVA']
    )
  
csvfile.close()

