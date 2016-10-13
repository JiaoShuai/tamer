//参考：http://blog.csdn.net/lancees/article/details/7616735
//参考：http://grokbase.com/t/gg/tasker/151nst55me/about-java-cell-ids-lac-mcc-mnc-gsm-cdma-lte-wcdma-and-all-that-funny-stuff-how-to-brew-your-own

package com.lovearthstudio.cells;
import org.apache.cordova.CallbackContext;  
import org.apache.cordova.CordovaPlugin;  
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException; 
import java.util.ArrayList;
import java.util.List;
import android.content.Context;
import android.telephony.TelephonyManager;
import android.telephony.CellInfo;
import android.telephony.CellInfoCdma;
import android.telephony.CellInfoGsm;
import android.telephony.CellInfoLte;
import android.telephony.CellInfoWcdma;
public class Cells extends CordovaPlugin {
	public static final String ACTION_NCI = "getNCI";

	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		if (ACTION_NCI.equals(action)) {
			TelephonyManager telephonyManager = (TelephonyManager)cordova.getActivity().getSystemService(Context.TELEPHONY_SERVICE);				
			int type = telephonyManager.getNetworkType();
			//之所以分成4类，是因为安卓api中cellinfo分为四个子类
			String networkType = "gsm";/*gsm,cdma,wcdma,lte,unknown*/
			switch(type)
			{
				case TelephonyManager.NETWORK_TYPE_GPRS:	
				case TelephonyManager.NETWORK_TYPE_EDGE: 
				case TelephonyManager.NETWORK_TYPE_HSDPA: networkType ="gsm";break;
				case TelephonyManager.NETWORK_TYPE_CDMA:
				case TelephonyManager.NETWORK_TYPE_1xRTT:
				case TelephonyManager.NETWORK_TYPE_EVDO_0:
				case TelephonyManager.NETWORK_TYPE_EVDO_A:networkType ="cdma";break;
				case TelephonyManager.NETWORK_TYPE_LTE: networkType ="lte";break;
				case TelephonyManager.NETWORK_TYPE_UMTS:
				case TelephonyManager.NETWORK_TYPE_HSUPA:
				case TelephonyManager.NETWORK_TYPE_HSPAP:
				case TelephonyManager.NETWORK_TYPE_HSPA:
				case TelephonyManager.NETWORK_TYPE_EVDO_B:
				case TelephonyManager.NETWORK_TYPE_IDEN:
				case TelephonyManager.NETWORK_TYPE_EHRPD:
				case TelephonyManager.NETWORK_TYPE_UNKNOWN:
				default:networkType ="unknown";break;		
			}


			List<CellInfo> list =telephonyManager.getAllCellInfo();
			JSONArray nci = new JSONArray();
			for (int i = 0; i < list.size(); i++) {
				int	   mcc = 0;
				int	   mnc = 0;
				int    lac = 0;
				int    cid = 0;
				int    dbm = 0;
				int    reg = list.get(i).isRegistered()?1:0;//这个网络是否在这个SIM卡上注册：如果注册，说明这个网络是附近最好的.isRegistered(): True if this cell is registered to the mobile network
				if(networkType=="gsm")
				{
					 CellInfoGsm info = (CellInfoGsm)list.get(i);
					 mcc = info.getCellIdentity().getMcc();
					 mnc = info.getCellIdentity().getMnc();
					 lac = info.getCellIdentity().getLac();
					 cid =  info.getCellIdentity().getCid();//CID Either 16-bit GSM Cell Identity described in TS 27.007, 0..65535, Integer.MAX_VALUE if unknown
					 dbm =  info.getCellSignalStrength().getDbm();//getDbm() Get the signal strength as dBm
				}else				
				if(networkType=="cmda")
				{
					 CellInfoCdma info = (CellInfoCdma)list.get(i);
					 mcc = Integer.parseInt(telephonyManager.getNetworkOperator().substring(0, 3));//从网上得知cdma需要如此得到mcc: http://blog.csdn.net/lancees/article/details/7616735
					 mnc = Integer.parseInt(telephonyManager.getNetworkOperator().substring(3, 5));
					 lac = info.getCellIdentity().getNetworkId();
					 cid =  info.getCellIdentity().getBasestationId ();//Base Station Id 0..65535, Integer.MAX_VALUE if unknown
					 dbm =  info.getCellSignalStrength().getDbm();//getDbm() Get the signal strength as dBm
				}else
				if(networkType=="lte")
				{
					
					 CellInfoLte info = (CellInfoLte)list.get(i);
					 mcc = info.getCellIdentity().getMcc(); //返回整形：3-digit Mobile Country Code, 0..999, Integer.MAX_VALUE if unknown
					 mnc = info.getCellIdentity().getMnc(); //返回整形：2 or 3-digit Mobile Network Code, 0..999, Integer.MAX_VALUE if unknown
					 lac = info.getCellIdentity().getTac(); //我们不清楚是不是lac,文档中标明：16-bit Tracking Area Code, Integer.MAX_VALUE if unknown
					 cid =  info.getCellIdentity().getCi(); //我们也不清楚ci是否就是cid:lte中的ci竟然是28bit的：28-bit Cell Identity, Integer.MAX_VALUE if unknown
					 dbm =  info.getCellSignalStrength().getDbm();//getDbm() Get the signal strength as dBm
				}else	
				if(networkType=="wcdma")
				{
					
					 CellInfoWcdma info = (CellInfoWcdma)list.get(i);
					 mcc = info.getCellIdentity().getMcc(); //返回整形：3-digit Mobile Country Code, 0..999, Integer.MAX_VALUE if unknown
					 mnc = info.getCellIdentity().getMnc(); //返回整形：2 or 3-digit Mobile Network Code, 0..999, Integer.MAX_VALUE if unknown
					 lac = info.getCellIdentity().getLac(); //16-bit Location Area Code, 0..65535, Integer.MAX_VALUE if unknown
					 cid = info.getCellIdentity().getCid(); //竟然是28bit:CID 28-bit UMTS Cell Identity described in TS 25.331, 0..268435455, Integer.MAX_VALUE if unknown
					 dbm = info.getCellSignalStrength().getDbm();//getDbm() Get the signal strength as dBm
				}	
				JSONObject jo=new JSONObject();
				jo.put("typ",networkType);
				jo.put("reg",reg);
				jo.put("mcc",mcc);
				jo.put("mnc",mnc);
				jo.put("lac",lac);
				jo.put("cid",cid);
				jo.put("dbm",dbm);
				nci.put(jo);
			}
			//JSONArray ja=new JSONArray();
			//ja.put(mcc);
			//ja.put(mnc);
			//ja.put(nci);
			callbackContext.success(nci);
			return true;
		}
		callbackContext.error("failure");
		return false;
	}
}