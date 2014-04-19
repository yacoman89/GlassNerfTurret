import pyaudio, socket, time, sys


    
class Audio:
    def __init__(self, time):
        self.device = self.list_devices()
        if not self.device:
                print 'FAIL: audio device (CABLE Output (VB-Audio Virtual) not present'
                exit
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 2
        self.rate = 44100
        self.seconds = time
        self.width = 2
        self.bucket = pyaudio.PyAudio()
        self.IP = '192.168.126.1'               #target ip address
        self.port = 8888                        #target port
        self.socket = self.connect()
        
    def list_devices(self):
        # Dynamically find id of virtual cord
        p = pyaudio.PyAudio()
        i = 0
        n = p.get_device_count()
        while i < n:
            try:
                dev['name'].index('Virtual Audio Cable')
                return i
            except: pass
            dev = p.get_device_info_by_index(i)
            if dev['maxInputChannels'] > 0:
                print str(i)+'. '+dev['name']
            i += 1

    def connect(self):
        return socket.socket(socket.AF_INET,    # Internet
                             socket.SOCK_DGRAM) # UDP


    def run(self):

        stream = self.bucket.open(
                        format= self.bucket.get_format_from_width( self.width ),
                        channels=self.channels,
                        rate=self.rate,
                         input=True,
                         input_device_index=self.device,
                        frames_per_buffer=self.chunk)

        print("* recording")

        frames = []

        for i in range(0, int(self.rate / self.chunk * self.seconds)):
            data = stream.read(self.chunk)
            self.socket.sendto(data, (self.IP, self.port))
                 
                
            #if data: print "data: ",  data.encode('hex')
            #else : print "No data"


        stream.stop_stream()
        stream.close()
        p.terminate()

        print("* done recording")


    
if __name__ == '__main__':
        try:
                sys.argv[1]
                secs = int(sys.argv[1])
        except:
                secs = 60*60*24*7*52            #record for a year.
        aud = Audio(500)
        aud.run()






